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

/** "The computers", in plain words (2026-11-01): what is inside, and where to get ours. @param {Hardware} hw */
export function computersTable(hw) {
  const ours = table(
    ['Our computer', "What's inside", 'Get one'],
    hw.codemany.map((m) => [
      `${m.name} (${osName(m.os)})`,
      `${m.cores} cores, ${size(m.ramGB)} memory, ${size(m.diskGB)} disk`,
      m.buyUrl ? `[Get one](${m.buyUrl})${m.buyNote ? ` (${m.buyNote})` : ''}` : '—',
    ]),
  );
  const theirs = table(
    ["GitHub's computer", "What's inside", 'Price per minute*'],
    hw.github.map((g) => [
      `\`${g.label}\` (${g.label.startsWith('macos') ? 'macOS' : 'Linux'})`,
      `${g.cpu}, ${size(g.ramGB)} memory`,
      `[$${g.perMinuteUSD}](${g.source})`,
    ]),
  );
  const asOf = hw.github[0]?.asOf ?? '';
  return [
    'You buy a Codemany computer once and keep it.',
    '',
    ours,
    '',
    'You rent a GitHub computer by the minute.',
    '',
    theirs,
    '',
    `\\* For private code, checked ${asOf} ([GitHub's prices](${hw.github[0]?.source ?? ''})).`,
  ].join('\n');
}
