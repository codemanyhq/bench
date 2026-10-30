// @ts-check
/** README fact tables built from data/projects.json and data/hardware.json (2026-10-30). */
import { table } from './blocks.mjs';

/** @typedef {import('./types.mjs').Project} Project */
/** @typedef {import('./types.mjs').Hardware} Hardware */
/** @typedef {import('./types.mjs').Os} Os */

/** @param {Os} os */
const osName = (os) => (os === 'macos' ? 'macOS' : 'Linux');
/** @param {number} gb */
const size = (gb) => (gb >= 1000 ? `${Math.round(gb / 100) / 10} TB` : `${gb} GB`);

/** "How we test": what gets built, exactly. @param {Project[]} projects */
export function projectsTable(projects) {
  return table(
    ['Project', 'Language', 'Computer', 'Build command', 'Exact commit'],
    projects.map((p) => [
      `[${p.name}](${p.url})`,
      p.lang,
      osName(p.os),
      `\`${p.command}\``,
      `[\`${p.sha.slice(0, 7)}\`](https://github.com/${p.repo}/commit/${p.sha})`,
    ]),
  );
}

/** "The computers": both sides, with buy links only where a real one is known. @param {Hardware} hw */
export function computersTable(hw) {
  const ours = table(
    ['Computer', 'Chip', 'Memory', 'Disk', 'Buy the same computer'],
    hw.codemany.map((m) => [
      `${m.name} (${osName(m.os)})`,
      m.cpu,
      size(m.ramGB),
      size(m.diskGB),
      m.buyUrl ? `[Buy the same computer](${m.buyUrl})${m.buyNote ? ` · ${m.buyNote}` : ''}` : '—',
    ]),
  );
  const theirs = table(
    ['Computer', 'Chip', 'Memory', 'Disk', 'Price per minute*'],
    hw.github.map((g) => [
      `\`${g.label}\` (${g.label.startsWith('macos') ? 'macOS' : 'Linux'})`,
      g.cpu,
      size(g.ramGB),
      size(g.diskGB),
      `[$${g.perMinuteUSD}](${g.source})`,
    ]),
  );
  const asOf = hw.github[0]?.asOf ?? '';
  const notes = hw.github.map((g) => `- \`${g.label}\`: ${g.priceNote}`).join('\n');
  return [
    '**Codemany computers** — small machines you buy once and keep.',
    '',
    ours,
    '',
    '**GitHub computers** — cloud machines you rent by the minute.',
    '',
    theirs,
    '',
    `\\* Private-repo prices, checked ${asOf}. Specs: [GitHub-hosted runners](${hw.github[0]?.specsSource ?? ''}).`,
    notes,
  ].join('\n');
}
