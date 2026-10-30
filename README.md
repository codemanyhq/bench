# Codemany Bench

Every night we build the same open-source code on GitHub's cloud and on a small Codemany computer, and show you which one finishes first.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="charts/speed-cold-dark.svg">
  <img alt="Build time from scratch: GitHub (black) vs Codemany (green)" src="charts/speed-cold-light.svg">
</picture>

## In one minute

- **Same code, same night, two computers.** Each project is built on GitHub and on Codemany.
- **Green is Codemany** on a small computer you own. **Black is GitHub's** cloud computer.
- **Every number links to the real run**, so you can check it yourself.

## What is this?

A public scoreboard for how fast code gets built.

When you change code, a computer builds and checks it. That computer is called a *runner*.

GitHub rents you runners in its cloud. [Codemany](https://codemany.com) lets you use a small computer you own instead.

This repo times both, every night, in the open. The full page with prices is at **[codemany.com/benchmarks](https://codemany.com/benchmarks)**.

## How we test

Same code. Same night. Two computers.

| Rule | What it means |
| --- | --- |
| Same code | Each project is pinned to one exact version (a *commit*). Both computers build that version. |
| Same command | We run each project's own build command, copied from its own CI setup. |
| Same tools | Both sides install the same Rust, Go and Node versions. Swift uses each computer's Xcode, printed in the run log. |
| One stopwatch | We time one step called `build`. Setup is timed too, but separately. |
| Same night | Both computers start at 03:17 UTC. |

### Cold and warm

Builds save files to go faster next time. These saved files are called a *cache*.

| Mode | What it means |
| --- | --- |
| Cold (from scratch) | Every cache is thrown away first, on both computers. |
| Warm (with saved caches) | Last night's caches are kept. GitHub downloads them from its cache service; Codemany still has them on its disk. |

### Every assumption favours GitHub

Whenever we had to pick, we picked what helps GitHub.

| We assume | Why it helps GitHub |
| --- | --- |
| GitHub's speed = its free 4-CPU Linux runner | Private repos get a slower 2-CPU runner. |
| GitHub's price = the cheaper 2-CPU rate, $0.006 a minute | The 4-CPU runner we time costs $0.012 a minute. |
| Codemany builds run one at a time | Each gets the whole computer, but its waiting time includes the build before it. |
| The headline is the `build` step only | GitHub's extra setup (downloading tools and caches) is left out. |

### What we build

<!-- projects:start -->
| Project | Language | Computer | Build command | Exact commit |
| --- | --- | --- | --- | --- |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Rust | Linux | `cargo build --release` | [`91f5d22`](https://github.com/BurntSushi/ripgrep/commit/91f5d22ef48bde459d90a8c7dbeab416e97d0f2b) |
| [Hugo](https://github.com/gohugoio/hugo) | Go | Linux | `go install` | [`8502b60`](https://github.com/gohugoio/hugo/commit/8502b60066b1059c0e24275ef8a3b642b1b2a10b) |
| [react.dev](https://github.com/reactjs/react.dev) | Next.js | Linux | `yarn install --frozen-lockfile && next build` | [`0821e7d`](https://github.com/reactjs/react.dev/commit/0821e7d9428a6c58c922765b891bbffba9ed6249) |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | Docker | Linux | `docker build -t excalidraw .` | [`a758e93`](https://github.com/excalidraw/excalidraw/commit/a758e93d6a03e9f995973703cb886850a398a6d3) |
| [SwiftLint](https://github.com/realm/SwiftLint) | Swift | macOS | `swift build -c release --product swiftlint` | [`ec4691d`](https://github.com/realm/SwiftLint/commit/ec4691d9e813a1d3358e82917326b56b0a71d3c9) |
<!-- projects:end -->

## The computers

Two small Codemany computers race two GitHub cloud computers.

<!-- computers:start -->
**Codemany computers** — small machines you buy once and keep.

| Computer | Chip | Memory | Disk | Buy the same computer |
| --- | --- | --- | --- | --- |
| Mini PC (Linux) | AMD Ryzen 7 8745H (8 cores / 16 threads) | 32 GB | 1 TB | — |
| Mac mini (macOS) | Apple silicon, 12 cores (Mac18,5) | 16 GB | 256 GB | [Buy the same computer](https://www.apple.com/mac-mini/) · 12-core chip, 16 GB memory, 256 GB disk |

**GitHub computers** — cloud machines you rent by the minute.

| Computer | Chip | Memory | Disk | Price per minute* |
| --- | --- | --- | --- | --- |
| `ubuntu-latest` (Linux) | 4 vCPU (x64) | 16 GB | 14 GB | [$0.006](https://docs.github.com/en/billing/reference/actions-runner-pricing) |
| `macos-latest` (macOS) | 3 vCPU (Apple M1, arm64) | 7 GB | 14 GB | [$0.062](https://docs.github.com/en/billing/reference/actions-runner-pricing) |

\* Private-repo prices, checked 2026-10-30. Specs: [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
- `ubuntu-latest`: Priced at the cheaper 2-core Linux rate; speed is measured on the faster 4-core public-repo runner.
- `macos-latest`: macOS 3-4 core rate.
<!-- computers:end -->

## Results

A robot fills this in after every nightly run.

<!-- bench:start -->
**No results yet.** The first nightly run starts at 03:17 UTC.
Results arrive here right after it finishes.
<!-- bench:end -->

## Check it yourself

Every number comes from a real GitHub Actions run you can open.

1. Open the [bench runs](https://github.com/codemanyhq/bench/actions/workflows/bench.yml).
2. Pick a job. Its name says what it is, like `ripgrep · codemany · cold`.
3. Open its `build` step. That step's time is the number in our tables.

The raw numbers live in [`data/results.json`](data/results.json). The script that reads them from GitHub is [`scripts/collect.mjs`](scripts/collect.mjs).

### Run it again

Maintainers press **Run workflow** on the [bench workflow](https://github.com/codemanyhq/bench/actions/workflows/bench.yml).

To run it on your own computer, fork this repo and connect a self-hosted runner with the labels `self-hosted`, `Linux` (or `macOS`) and `codemany`. Until one connects, the Codemany jobs wait in line.

## Safety

This repo never runs code from strangers.

| Rule | Why |
| --- | --- |
| It runs only on a timer or the **Run workflow** button | Pull requests could run anyone's code on our own computers, so they never start it. |
| Build jobs get a read-only token | A build cannot change this repo. |
| The collector only commits `data/`, `charts/` and this README | Results are the only thing that changes by itself. |
| Every outside action is pinned to a full commit SHA | A SHA is a fingerprint, so nobody can swap the code behind it. |
| Every project is pinned to a full commit SHA | Changing what we build takes a reviewed commit to [`data/projects.json`](data/projects.json). |

## License

[MIT](LICENSE)
