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

/** @param {Summary} s @param {DataModule} fmt */
function modeTable(s, fmt) {
  return table(
    ['Project', 'GitHub', 'Codemany', 'Result', 'GitHub price¹', 'Latest runs'],
    s.projects.map((p) => [
      p.name,
      fmt.formatDuration(p.github?.medianSec),
      fmt.formatDuration(p.codemany?.medianSec),
      p.speedup == null ? '—' : fmt.formatSpeedup(p.speedup),
      fmt.formatUSD(p.githubCostUSD),
      proof(p),
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
    `Median build time over the last ${cold.windowDays} nights. Updated ${updated}.`,
    '',
    '### From scratch (cold)',
    '',
    modeTable(cold, fmt),
    '',
    '### With saved caches (warm)',
    '',
    picture('charts/speed-warm', 'Build time with saved caches: GitHub vs Codemany'),
    '',
    modeTable(warm, fmt),
    '',
    '### Night by night (from scratch)',
    '',
    ...trends,
    '¹ What one GitHub job would cost in a private repo, at the prices in [The computers](#the-computers).',
  ].join('\n');
}
