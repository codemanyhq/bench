// @ts-check
/** Minimal GitHub REST client for the collector (2026-10-30). Node 20 fetch, no deps. */

/** @typedef {import('./types.mjs').ApiJob} ApiJob */
/** @typedef {import('./types.mjs').ApiRun} ApiRun */

const API = process.env.GITHUB_API_URL || 'https://api.github.com';

/**
 * @template T
 * @param {string} route  e.g. /repos/o/r/actions/runs/1
 * @returns {Promise<T>}
 */
async function get(route) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  const res = await fetch(`${API}${route}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'codemany-bench-collector',
    },
  });
  if (!res.ok) throw new Error(`GET ${route} → HTTP ${res.status}: ${await res.text()}`);
  return /** @type {Promise<T>} */ (res.json());
}

/** @param {string} repo @param {number} runId @returns {Promise<ApiRun>} */
export function getRun(repo, runId) {
  return get(`/repos/${repo}/actions/runs/${runId}`);
}

/** Latest attempt's jobs of one run, all pages. @param {string} repo @param {number} runId */
export async function listJobs(repo, runId) {
  /** @type {ApiJob[]} */
  const jobs = [];
  for (let page = 1; ; page += 1) {
    /** @type {{ total_count: number, jobs: ApiJob[] }} */
    const body = await get(`/repos/${repo}/actions/runs/${runId}/jobs?per_page=100&page=${page}`);
    jobs.push(...body.jobs);
    if (body.jobs.length < 100 || jobs.length >= body.total_count) return jobs;
  }
}

/** Newest completed runs of one workflow file. @param {string} repo @param {string} file @param {number} count */
export async function listRecentRuns(repo, file, count) {
  /** @type {{ workflow_runs: ApiRun[] }} */
  const body = await get(`/repos/${repo}/actions/workflows/${file}/runs?status=completed&per_page=${count}`);
  return body.workflow_runs;
}
