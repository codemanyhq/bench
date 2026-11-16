// @ts-check
/**
 * Minimal GitHub REST client for the collector (2026-10-30). Node 20 fetch, no deps.
 * 2026-11-01: every call takes a BenchSource, so each repo is read with its own token.
 */

/** @typedef {import('./types.mjs').ApiJob} ApiJob */
/** @typedef {import('./types.mjs').ApiRun} ApiRun */
/** @typedef {import('./types.mjs').BenchSource} BenchSource */

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const RETRIES = 5;
const RETRY_WAIT_MS = 3000;

/**
 * @template T
 * @param {BenchSource} src  its token authorizes the call
 * @param {string} route     e.g. /repos/o/r/actions/runs/1
 * @returns {Promise<T>}
 */
async function get(src, route) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`${API}${route}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${src.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'codemany-bench-collector',
      },
    }).catch((/** @type {Error} */ e) => e);
    if (res instanceof Response && res.ok) return /** @type {Promise<T>} */ (res.json());
    const why = res instanceof Response ? `HTTP ${res.status}: ${await res.text()}` : String(res);
    // 2026-11-06: GitHub answers 502/503/504 (or drops the connection) now and then; one bad call used to fail
    // the whole collect. Retry those up to RETRIES times with a growing wait; anything else fails at once.
    const transient = !(res instanceof Response) || res.status >= 500;
    if (!transient || attempt >= RETRIES) throw new Error(`GET ${route} → ${why}`);
    await new Promise((r) => setTimeout(r, attempt * RETRY_WAIT_MS));
  }
}

/** @param {BenchSource} src @param {number} runId @returns {Promise<ApiRun>} */
export function getRun(src, runId) {
  return get(src, `/repos/${src.repo}/actions/runs/${runId}`);
}

/** One attempt's jobs of one run, all pages. @param {BenchSource} src @param {number} runId @param {number} attempt */
async function listAttemptJobs(src, runId, attempt) {
  /** @type {ApiJob[]} */
  const jobs = [];
  for (let page = 1; ; page += 1) {
    /** @type {{ total_count: number, jobs: ApiJob[] }} */
    const body = await get(src, `/repos/${src.repo}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100&page=${page}`);
    jobs.push(...body.jobs);
    if (body.jobs.length < 100 || jobs.length >= body.total_count) return jobs;
  }
}

/**
 * Jobs of EVERY attempt of one run (2026-11-15, CMY-107; was the latest attempt only). A
 * re-run warm job skips its build when an earlier attempt measured it, so that earlier
 * attempt's row must be read too, even when collect first sees the run after its re-run.
 * lib/store.mjs keeps one row per slot. @param {BenchSource} src @param {ApiRun} run
 */
export async function listJobs(src, run) {
  const attempts = run.run_attempt;
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error(`run ${run.id}: bad run_attempt ${attempts}`);
  /** @type {ApiJob[]} */
  const jobs = [];
  for (let n = 1; n <= attempts; n += 1) jobs.push(...await listAttemptJobs(src, run.id, n));
  return jobs;
}

/** Newest completed runs of the source's workflow. @param {BenchSource} src @param {number} count */
export async function listRecentRuns(src, count) {
  /** @type {{ workflow_runs: ApiRun[] }} */
  const body = await get(src, `/repos/${src.repo}/actions/workflows/${src.workflow}/runs?status=completed&per_page=${count}`);
  return body.workflow_runs;
}
