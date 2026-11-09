// @ts-check
/**
 * The README "Results" block (2026-10-30): small tables + charts, every number linked.
 * This is the block for a site module that predates private/public code; see
 * results-code-md.mjs for the one that shows private code first (2026-11-01).
 */
import { picture } from './blocks.mjs';
import { modeTable, plainView, simpleTable, trendPictures } from './results-tables.mjs';

/** @typedef {import('./types.mjs').DataModule} DataModule */
/** @typedef {import('./types.mjs').Summary} Summary */

/** Shown until the first nightly run has been collected. */
export const NO_RESULTS = [
  '**No results yet.** The first nightly run starts at 03:17 UTC.',
  'Results arrive here right after it finishes.',
].join('\n');

/** @param {Summary} cold @param {Summary} warm @param {DataModule} fmt */
export function resultsBlock(cold, warm, fmt) {
  const updated = (cold.updatedAt ?? '').slice(0, 10);
  const view = plainView(fmt);
  return [
    `Time to build each project from scratch (the middle of every run in the last ${cold.windowDays} days). Updated ${updated}.`,
    '',
    simpleTable(cold, fmt, view),
    '',
    // 2026-11-06: run by run is always shown (no longer folded). 2026-11-09: runs, not nights:
    // extra runs during the day count the same as the nightly one (codemany.com bench-data.js).
    `### Run by run, the last 30 runs (from scratch)`,
    '',
    ...trendPictures(cold),
    '<details>',
    '<summary><b>More numbers</b>: with saved files, prices</summary>',
    '',
    '### From scratch',
    '',
    modeTable(cold, fmt, view),
    '',
    '### With saved files',
    '',
    picture('charts/speed-warm', 'Build time with saved files: GitHub vs Codemany'),
    '',
    modeTable(warm, fmt, view),
    '',
    '¹ What one GitHub build would cost for private code, at the prices in [The computers](#the-computers).',
    'These GitHub times are from public code. On Linux that is a 4-core computer; private code gets a 2-core one.',
    '',
    '</details>',
  ].join('\n');
}
