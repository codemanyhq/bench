#!/usr/bin/env bash
# The measured `build` step (2026-10-30), run inside ./src.
# Each line is the project's OWN CI build command (source named on the right).
# Extra flags only point caches at $BENCH_CACHE (see env.sh); nothing else is changed.
set -euo pipefail

case "$BENCH_PROJECT" in
  ripgrep)    cargo build --release ;;                                  # ripgrep ci.yml / README
  hugo)       go install ;;                                             # hugo test.yml
  react-dev)  yarn install --frozen-lockfile                            # react.dev analyze.yml
              ./node_modules/.bin/next build ;;
  excalidraw) bash "$BENCH_SCRIPTS/docker-build.sh" excalidraw ;;       # build-docker.yml
  swiftlint)  swift build --configuration release -Xlinker -dead_strip \
                --product swiftlint \
                --scratch-path "$BENCH_CACHE/build" \
                --cache-path "$BENCH_CACHE/swiftpm" ;;                  # SwiftLint Makefile
  *) echo "::error::no build command for '$BENCH_PROJECT'"; exit 1 ;;
esac
