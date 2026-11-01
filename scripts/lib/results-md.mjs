// @ts-check
/** The README "Results" block (2026-10-30): small tables + charts, every number linked. */
import { picture, table } from './blocks.mjs';

/** @typedef {import('./types.mjs').DataModule} DataModule */
/** @typedef {import('./types.mjs').Summary} Summary */
/** @typedef {import('./types.mjs').ProjectSummary} ProjectSummary */

/** Shown until the first nightly run has been collected. */
export const NO_RESULTS = [
  '**No results yet.** The first nightly run starts at 03:17 UTC.',
  'Results arrive here right after it finishes.',
].join('\n');

/** @param {ProjectSummary} p */
function proof(p) {
  const links = [];
  if (p.github) links.push(`[GitHub](${p.github.lastJobUrl})`);
  if (p.codemany) links.push(`[Codemany](${p.codemany.lastJobUrl})`);
  return links.join(' · ') || '—';
}

/** The one table most readers need (2026-11-01): who is faster, and by how much. @param {Summary} s @param {DataModule} fmt */
function simpleTable(s, fmt) {
  return table(
    ['Project', 'GitHub', 'Codemany', 'Codemany is…', 'Check it'],
    s.projects.map((p) => [
      p.name,
      fmt.formatDuration(p.github?.medianSec),
      fmt.formatDuration(p.codemany?.medianSec),
      p.speedup == null ? 'not measured yet' : `**${fmt.formatSpeedup(p.speedup)}**`,
      proof(p),
    ]),
  );
}

/** The fuller table, under "More numbers". @param {Summary} s @param {DataModule} fmt */
function modeTable(s, fmt) {
  return table(
    ['Project', 'GitHub', 'Codemany', 'Result', 'GitHub price¹'],
    s.projects.map((p) => [
      p.name,
      fmt.formatDuration(p.github?.medianSec),
      fmt.formatDuration(p.codemany?.medianSec),
      p.speedup == null ? '—' : fmt.formatSpeedup(p.speedup),
      fmt.formatUSD(p.githubCostUSD),
    ]),
  );
}

/** @param {Summary} cold @param {Summary} warm @param {DataModule} fmt */
export function resultsBlock(cold, warm, fmt) {
  const updated = (cold.updatedAt ?? '').slice(0, 10);
  const trends = cold.projects
    .filter((p) => p.trend.length > 0)
    .flatMap((p) => [`**${p.name}**`, '', picture(`charts/trend-${p.id}`, `${p.name}: build time per night`), '']);
  return [
    `Time to build each project from scratch (the middle of the last ${cold.windowDays} nights). Updated ${updated}.`,
    '',
    simpleTable(cold, fmt),
    '',
    '<details>',
    '<summary><b>More numbers</b>: with saved files, prices, night by night</summary>',
    '',
    '### From scratch',
    '',
    modeTable(cold, fmt),
    '',
    '### With saved files from last night',
    '',
    picture('charts/speed-warm', 'Build time with saved files: GitHub vs Codemany'),
    '',
    modeTable(warm, fmt),
    '',
    '### Night by night (from scratch)',
    '',
    ...trends,
    '¹ What one GitHub build would cost for private code, at the prices in [The computers](#the-computers).',
    '',
    '</details>',
  ].join('\n');
}
