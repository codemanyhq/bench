// @ts-check
/**
 * Shared JSDoc types for the bench scripts (2026-10-30).
 * They mirror the data contract in data/*.json that codemany.com/benchmarks reads,
 * and the Summary returned by the shared module bench-data.js. Keep them in sync.
 */

/** @typedef {'github'|'codemany'} Side */
/** @typedef {'cold'|'warm'} Mode */
/** @typedef {'linux'|'macos'} Os */
/** @typedef {'light'|'dark'} ThemeName */
/** @typedef {'success'|'failure'|'cancelled'} Conclusion */

/**
 * One measured bench job (data/results.json → runs[]).
 * @typedef {object} RunRow
 * @property {number} runId
 * @property {number} jobId          dedupe key
 * @property {string} runUrl
 * @property {string} jobUrl
 * @property {string} date           ISO-8601 job start
 * @property {string} project        Project.id
 * @property {Mode} mode
 * @property {Side} side
 * @property {Os} os
 * @property {string} runner         runs-on label (GitHub) or runner name (Codemany)
 * @property {number} queueSec       created → started
 * @property {number} jobSec         started → completed
 * @property {number|null} buildSec  the `build` step; null when it did not succeed
 * @property {Conclusion} conclusion
 */

/**
 * @typedef {object} ResultsFile
 * @property {1} schema
 * @property {string|null} updatedAt
 * @property {RunRow[]} runs
 */

/**
 * One pinned open-source build (data/projects.json).
 * @typedef {object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} repo       owner/name
 * @property {string} sha        full commit SHA
 * @property {string} lang
 * @property {Os} os
 * @property {string} command    the project's own CI build command
 * @property {string} url
 * @property {string} toolchain
 * @property {boolean} [trial]  runs nightly, kept out of the published numbers (2026-11-01)
 */

/**
 * @typedef {object} CodemanyMachine
 * @property {string} id
 * @property {string} name
 * @property {Os} os
 * @property {string} cpu
 * @property {number} cores
 * @property {number} ramGB
 * @property {number} diskGB
 * @property {number|null} priceUSD
 * @property {number} lifeYears
 * @property {number|null} watts
 * @property {string|null} buyUrl    only a real product page, never a guess
 * @property {string|null} buyNote
 */

/**
 * @typedef {object} GithubRunner
 * @property {string} label
 * @property {string} cpu
 * @property {number} ramGB
 * @property {number} diskGB
 * @property {number} perMinuteUSD   private-repo price
 * @property {string} priceNote
 * @property {string} source
 * @property {string} specsSource
 * @property {string} asOf
 */

/** @typedef {{ codemany: CodemanyMachine[], github: GithubRunner[] }} Hardware */

/** @typedef {{ medianSec: number, p90Sec: number, n: number, runner: string, lastJobUrl: string }} SideStat */
/** @typedef {{ date: string, github: number|null, codemany: number|null }} TrendPoint */

/**
 * @typedef {object} ProjectSummary
 * @property {string} id
 * @property {string} name
 * @property {string} lang
 * @property {Os} os
 * @property {SideStat|null} github
 * @property {SideStat|null} codemany
 * @property {number|null} speedup
 * @property {number|null} githubCostUSD
 * @property {number|null} codemanyCostUSD
 * @property {TrendPoint[]} trend
 */

/**
 * @typedef {object} Summary
 * @property {Mode} mode
 * @property {number} windowDays
 * @property {string|null} updatedAt
 * @property {number} nights
 * @property {{ speedup: number|null, githubMedianSec: number|null, codemanyMedianSec: number|null }} overall
 * @property {ProjectSummary[]} projects
 */

/**
 * The two shared modules served by codemany.com/benchmarks.
 * @typedef {object} DataModule
 * @property {(r: ResultsFile, p: Project[], h: Hardware, o: { mode: Mode, days?: number, now?: Date }) => Summary} summarize
 * @property {(sec: number|null|undefined) => string} formatDuration
 * @property {(x: number|null|undefined) => string} formatSpeedup
 * @property {(usd: number|null|undefined) => string} formatUSD
 */
/**
 * @typedef {object} ChartModule
 * @property {(s: Summary, o: { width: number, theme: ThemeName }) => string} barsSVG
 * @property {(p: ProjectSummary, o: { width: number, height?: number, theme: ThemeName }) => string} trendSVG
 */
/** @typedef {{ data: DataModule, chart: ChartModule }} BenchModules */

/** GitHub REST shapes (only the fields we read). */
/** @typedef {{ name: string, conclusion: string|null, started_at: string|null, completed_at: string|null }} ApiStep */
/**
 * @typedef {object} ApiJob
 * @property {number} id
 * @property {string} html_url
 * @property {string} name
 * @property {string} status
 * @property {string|null} conclusion
 * @property {string} created_at
 * @property {string|null} started_at
 * @property {string|null} completed_at
 * @property {string|null} runner_name
 * @property {string[]} labels
 * @property {ApiStep[]=} steps
 */
/**
 * @typedef {object} ApiRun
 * @property {number} id
 * @property {string} html_url
 * @property {string} path
 * @property {string} event
 * @property {string} status
 */

export {};
