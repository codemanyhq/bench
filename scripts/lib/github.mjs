// @ts-check
/**
 * Minimal GitHub REST client for the collector (2026-10-30). Node 20 fetch, no deps.
 * 2026-11-01: every call takes a BenchSource, so each repo is read with its own token.
 */

/** @typedef {import('./types.mjs').ApiJob} ApiJob */
/** @typedef {import('./types.mjs').ApiRun} ApiRun */
/** @typedef {import('./types.mjs').BenchSource} BenchSource */

const API = process.env.GITHUB_API_URL || 'https://api.github.com';

/**
 * @template T
 * @param {BenchSource} src  its token authorizes the call
 * @param {string} route     e.g. /repos/o/r/actions/runs/1
 * @returns {Promise<T>}
 */
async function get(src, route) {
  const res = await fetch(`${API}${route}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${src.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'codemany-bench-collector',
    },
  });
  if (!res.ok) throw new Error(`GET ${route} → HTTP ${res.status}: ${await res.text()}`);
  return /** @type {Promise<T>} */ (res.json());
}

/** @param {BenchSource} src @param {number} runId @returns {Promise<ApiRun>} */
export function getRun(src, runId) {
  return get(src, `/repos/${src.repo}/actions/runs/${runId}`);
}

/** Latest attempt's jobs of one run, all pages. @param {BenchSource} src @param {number} runId */
export async function listJobs(src, runId) {
  /** @type {ApiJob[]} */
  const jobs = [];
  for (let page = 1; ; page += 1) {
    /** @type {{ total_count: number, jobs: ApiJob[] }} */
    const body = await get(src, `/repos/${src.repo}/actions/runs/${runId}/jobs?per_page=100&page=${page}`);
    jobs.push(...body.jobs);
    if (body.jobs.length < 100 || jobs.length >= body.total_count) return jobs;
  }
}

/** Newest completed runs of the source's workflow. @param {BenchSource} src @param {number} count */
export async function listRecentRuns(src, count) {
  /** @type {{ workflow_runs: ApiRun[] }} */
  const body = await get(src, `/repos/${src.repo}/actions/workflows/${src.workflow}/runs?status=completed&per_page=${count}`);
  return body.workflow_runs;
}
