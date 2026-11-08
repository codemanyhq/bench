// @ts-check
/**
 * Launch-kit numbers for PRIVATE code, from scratch (2026-11-08).
 *
 * render.mjs writes these to data/kit.json, so the nightly launch-kit agent only READS
 * a JSON file instead of downloading and running codemany.com's page code (its safety
 * check blocks running downloaded code). Same summary as the site and README
 * (summaries.mjs → the site's summarize), so every number stays one-to-one: each GitHub
 * build is paired with exactly one Codemany build (bench-pair.js on codemany.com).
 */

/** @typedef {import('./types.mjs').Summary} Summary */
/** @typedef {import('./types.mjs').Os} Os */

/** One bar on the kit's private card. @typedef {{ name: string, os: Os, speedup: number, nights: number }} KitRow */

/**
 * Values for the kit's <!--b:KEY--> markers, exactly as the page shows them.
 * @typedef {object} KitNumbers
 * @property {string} updatedAt    newest result time in the summary (render time if none)
 * @property {string} privbars     HTML bar rows, fastest first
 * @property {string} privrange    e.g. "1.2× to 3.4×"
 * @property {string} privrangex   same with a plain x, for plain-text channels
 * @property {string} privpairs    matched Linux nights, e.g. "2" or "1–2"
 * @property {string} privnote     one-line footnote under the bars
 */

/** @param {number} v */
const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);

/** "2" when all equal, else "min–max". @param {number[]} a */
const span = (a) => (Math.min(...a) === Math.max(...a) ? `${Math.min(...a)}` : `${Math.min(...a)}–${Math.max(...a)}`);

/** Projects with a speedup, fastest first; nights = the smaller side's matched count. @param {Summary} s @returns {KitRow[]} */
function rows(s) {
  /** @type {KitRow[]} */
  const out = [];
  for (const p of s.projects) {
    if (p.speedup == null || !p.github || !p.codemany) continue;
    out.push({ name: p.name, os: p.os, speedup: p.speedup, nights: Math.min(p.github.n, p.codemany.n) });
  }
  return out.sort((a, b) => b.speedup - a.speedup);
}

/** @param {KitRow} r @param {number} top */
const bar = (r, top) => `<div class="r"><span>${r.name}</span><span class="b"><i style="width:${Math.round((r.speedup / top) * 100)}%"></i></span><span class="x">${f1(r.speedup)}×</span></div>`;

/**
 * @param {Summary} cold  private-code, from-scratch summary of PUBLISHED projects only
 * @param {Date} now
 * @returns {KitNumbers|null} null when private code has no pairs yet
 */
export function kitNumbers(cold, now) {
  if (cold.code !== 'private') return null;
  const r = rows(cold);
  if (r.length === 0) return null;
  const top = r[0].speedup, low = r[r.length - 1].speedup;
  const lin = r.filter((x) => x.os === 'linux').map((x) => x.nights);
  const mac = r.filter((x) => x.os === 'macos').map((x) => `${x.name} on ${x.nights}`).join(', ');
  const linPart = lin.length ? `Linux rests on ${span(lin)} matched nights so far (private Linux timed nightly since Nov 7)` : 'No Linux pairs yet';
  const head = cold.overall.speedup == null ? '' : ` Site headline: ${f1(cold.overall.speedup)}×.`;
  return {
    updatedAt: cold.updatedAt ?? now.toISOString(),  // data time, so no-op renders make no commit
    privbars: `\n${r.map((x) => bar(x, top)).join('\n')}\n`,
    privrange: `${f1(low)}× to ${f1(top)}×`,
    privrangex: `${f1(low)}x to ${f1(top)}x`,
    privpairs: lin.length ? span(lin) : '0',
    privnote: `${linPart}${mac ? `; ${mac}` : ''}.${head}`,
  };
}
