// @ts-check
/**
 * Was this job already measured in an earlier attempt of the same run? (2026-11-15, CMY-107)
 *
 * "Re-run failed jobs" re-runs every job that depends on a failed one, passed legs included:
 * one GitHub cold flake (run 42728702722, nowinandroid) re-ran all 13 github-warm jobs. Each
 * had already restored and deleted its saved files on attempt 1 ("drop used cache entry"),
 * so attempt 2 failed every one of them with "no saved files". A warm job that already has a
 * real measurement (build passed from restored files) now skips its build on a re-run, and
 * collect keeps the earlier attempt's row (lib/rows.mjs ignores the skipped job).
 */
import { cacheHitOf } from './cache-hit.mjs';

/** @typedef {import('./types.mjs').ApiJob} ApiJob */
/** @typedef {import('./types.mjs').Mode} Mode */
/** @typedef {import('./types.mjs').Side} Side */

/** bench.yml's marker step: runs (success) only on a job skipped as already measured. */
export const MEASURED_EARLIER_STEP = 'measured in an earlier attempt';

/**
 * @typedef {object} BenchJobId  the `<project> · <side> · <mode>` of the job looking back
 * @property {string} project
 * @property {Side} side
 * @property {Mode} mode
 */

/** Same bench slot? Job names are `<project> · <side> · <mode>` (bench.yml, lib/rows.mjs). @param {ApiJob} job @param {BenchJobId} me */
function sameSlot(job, me) {
  return job.name.trim() === `${me.project} · ${me.side} · ${me.mode}`;
}

/**
 * A real measurement: the job and its `build` passed, and a warm one restored its files.
 * A job that was itself skipped as "measured earlier" has a skipped build, so it never counts.
 * @param {ApiJob} job @param {BenchJobId} me
 */
function isMeasured(job, me) {
  if (job.conclusion !== 'success') return false;
  if (job.steps?.find((s) => s.name === 'build')?.conclusion !== 'success') return false;
  return me.mode !== 'warm' || cacheHitOf(job, me.side, me.mode) === true;
}

/**
 * The earlier job that already measured this slot, or null.
 * @param {ApiJob[]} earlierJobs  jobs of attempts 1 … current-1
 * @param {BenchJobId} me
 * @returns {ApiJob|null}
 */
export function earlierMeasurement(earlierJobs, me) {
  return earlierJobs.find((job) => sameSlot(job, me) && isMeasured(job, me)) ?? null;
}

/** Did collect see a job that only stood in for an earlier attempt's row? @param {ApiJob} job */
export function isStandIn(job) {
  return job.steps?.some((s) => s.name === MEASURED_EARLIER_STEP && s.conclusion === 'success') ?? false;
}
