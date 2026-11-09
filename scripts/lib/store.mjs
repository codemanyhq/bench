// @ts-check
/** Merges new rows into results.json's runs (2026-10-30). */

/** @typedef {import('./types.mjs').RunRow} RunRow */

/** How long rows are kept. */
export const KEEP_DAYS = 120;
const DAY_MS = 86_400_000;

/**
 * One build slot: the same run, project, side and mode. 2026-11-08: re-running a run's
 * failed jobs gives EVERY job of the new attempt a new job id (passed ones included),
 * so deduping by job id alone stored one build two or three times and broke one-to-one
 * pairing. A slot keeps ONE row: its newest passed attempt, else its newest attempt.
 * (A later attempt can fail for reasons the earlier pass did not have, e.g. its warm
 * job's saved files expired before the re-run.)
 * @param {RunRow} r
 */
const slot = (r) => `${r.runId}|${r.project}|${r.side}|${r.mode}`;

/** Does `a` replace `b` in the same slot? @param {RunRow} a @param {RunRow} b */
function better(a, b) {
  const ok = (/** @type {RunRow} */ r) => r.conclusion === 'success';
  if (ok(a) !== ok(b)) return ok(a);
  return a.jobId >= b.jobId;
}

/**
 * One row per slot (pass beats fail; among equals the highest job id, i.e. newest, wins), drop
 * rows older than keepDays, and sort oldest → newest so the file reads as an append-only log.
 * @param {RunRow[]} existing
 * @param {RunRow[]} incoming
 * @param {Date} now
 * @param {number} [keepDays]
 * @returns {RunRow[]}
 */
export function mergeRuns(existing, incoming, now, keepDays = KEEP_DAYS) {
  /** @type {Map<string, RunRow>} */
  const bySlot = new Map();
  for (const row of [...existing, ...incoming]) {
    const old = bySlot.get(slot(row));
    if (!old || better(row, old)) bySlot.set(slot(row), row);
  }
  const cutoff = now.getTime() - keepDays * DAY_MS;
  return [...bySlot.values()]
    .filter((row) => Date.parse(row.date) >= cutoff)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.jobId - b.jobId);
}
