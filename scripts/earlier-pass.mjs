// @ts-check
/**
 * bench.yml step "earlier attempt" (actions/github-script, 2026-11-15, CMY-107): on a re-run
 * attempt, sets BENCH_MEASURED=true when an earlier attempt of THIS job already measured it,
 * so the job skips prepare + build (lib/earlier-pass.mjs says why). Any API error fails the
 * step: a red job is better than a warm build silently timed without its saved files.
 *
 * Env: BENCH_PROJECT BENCH_SIDE BENCH_MODE (job env), GITHUB_RUN_ATTEMPT (runner).
 */
import { earlierMeasurement } from './lib/earlier-pass.mjs';

/** @typedef {import('./lib/types.mjs').ApiJob} ApiJob */
/** @typedef {import('./lib/types.mjs').Mode} Mode */
/** @typedef {import('./lib/types.mjs').Side} Side */

/**
 * The parts of actions/github-script's arguments this step uses.
 * @typedef {object} ScriptArgs
 * @property {{ paginate: (route: string, params: object) => Promise<ApiJob[]> }} github
 * @property {{ repo: { owner: string, repo: string }, runId: number }} context
 * @property {{ exportVariable: (k: string, v: string) => void, notice: (m: string) => void, info: (m: string) => void }} core
 */

/** @param {string} key @returns {string} */
function need(key) {
  const v = (process.env[key] ?? '').trim();
  if (!v) throw new Error(`${key} is not set`);
  return v;
}

/** @param {string} raw @returns {number} */
function attemptOf(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new Error(`GITHUB_RUN_ATTEMPT must be a positive integer, got "${raw}"`);
  return n;
}

/** Jobs of attempts 1 … current-1. @param {ScriptArgs} args @param {number} current */
async function earlierJobs({ github, context }, current) {
  /** @type {ApiJob[]} */
  const jobs = [];
  for (let n = current - 1; n >= 1; n -= 1) {
    jobs.push(...await github.paginate('GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs', {
      ...context.repo, run_id: context.runId, attempt_number: n, per_page: 100,
    }));
  }
  return jobs;
}

/** @param {ScriptArgs} args */
export default async function check(args) {
  const me = {
    project: need('BENCH_PROJECT'),
    side: /** @type {Side} */ (need('BENCH_SIDE')),
    mode: /** @type {Mode} */ (need('BENCH_MODE')),
  };
  const attempt = attemptOf(need('GITHUB_RUN_ATTEMPT'));
  if (attempt === 1) return args.core.info('first attempt: nothing measured earlier');
  const earlier = earlierMeasurement(await earlierJobs(args, attempt), me);
  if (!earlier) return args.core.info(`no earlier attempt measured ${me.project} · ${me.side} · ${me.mode}: building`);
  args.core.exportVariable('BENCH_MEASURED', 'true');
  args.core.notice(`already measured in an earlier attempt of this run (${earlier.html_url}); its saved files were used and deleted then, so this attempt skips the build and collect keeps that row`);
}
