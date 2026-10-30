#!/usr/bin/env node
// @ts-check
/**
 * collect — reads bench runs from the GitHub API and appends their jobs to
 * data/results.json (2026-10-30).
 *
 *   BENCH_RUN_ID=<id> node scripts/collect.mjs   one run (collect.yml passes it)
 *   node scripts/collect.mjs                      the last 10 completed bench runs
 *
 * Env: GITHUB_TOKEN (actions: read), GITHUB_REPOSITORY (default codemanyhq/bench).
 * Per job: queueSec = created→started, jobSec = started→completed, buildSec = the
 * `build` step. Rows are deduped by job id, kept for 120 days, newest last.
 */
import path from 'node:path';
import { dataDir, readJson, writeJson } from './lib/files.mjs';
import { getRun, listJobs, listRecentRuns } from './lib/github.mjs';
import { toRow } from './lib/rows.mjs';
import { mergeRuns } from './lib/store.mjs';

/** @typedef {import('./lib/types.mjs').ApiRun} ApiRun */
/** @typedef {import('./lib/types.mjs').Project} Project */
/** @typedef {import('./lib/types.mjs').ResultsFile} ResultsFile */
/** @typedef {import('./lib/types.mjs').RunRow} RunRow */

const WORKFLOW_FILE = 'bench.yml';
const RECENT_RUNS = 10;
/** bench.yml only has these triggers; anything else is not ours to trust. */
const TRUSTED_EVENTS = new Set(['schedule', 'workflow_dispatch']);

/** @param {string} repo @returns {Promise<ApiRun[]>} */
async function runsToCollect(repo) {
  const id = (process.env.BENCH_RUN_ID || process.argv[2] || '').trim();
  if (!id) return listRecentRuns(repo, WORKFLOW_FILE, RECENT_RUNS);
  if (!/^\d+$/.test(id)) throw new Error(`run id must be a number, got "${id}"`);
  return [await getRun(repo, Number(id))];
}

/** @param {ApiRun} run */
function isBenchRun(run) {
  return run.path.startsWith(`.github/workflows/${WORKFLOW_FILE}`)
    && run.status === 'completed'
    && TRUSTED_EVENTS.has(run.event);
}

/** @param {string} repo @param {Map<string, Project>} projects @returns {Promise<RunRow[]>} */
async function collectRows(repo, projects) {
  /** @type {RunRow[]} */
  const rows = [];
  for (const run of await runsToCollect(repo)) {
    if (!isBenchRun(run)) {
      console.warn(`skip run ${run.id}: not a finished scheduled/dispatched bench run`);
      continue;
    }
    for (const job of await listJobs(repo, run.id)) {
      const row = toRow(run, job, projects);
      if (row) rows.push(row);
    }
  }
  return rows;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY || 'codemanyhq/bench';
  const dir = dataDir();
  const resultsFile = path.join(dir, 'results.json');
  /** @type {ResultsFile} */
  const results = await readJson(resultsFile);
  /** @type {Project[]} */
  const projectList = await readJson(path.join(dir, 'projects.json'));

  const rows = await collectRows(repo, new Map(projectList.map((p) => [p.id, p])));
  const now = new Date();
  /** @type {ResultsFile} */
  const next = {
    schema: 1,
    updatedAt: rows.length > 0 ? now.toISOString() : results.updatedAt,
    runs: mergeRuns(results.runs, rows, now),
  };
  await writeJson(resultsFile, next);
  console.log(`collected ${rows.length} jobs; results.json now holds ${next.runs.length} rows`);
}

main().catch((err) => {
  console.error(`::error::collect failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
