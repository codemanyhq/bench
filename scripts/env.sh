#!/usr/bin/env bash
# Points every cache of one project at ONE folder, $BENCH_CACHE, and exports it to the
# next steps through $GITHUB_ENV (2026-10-30).
#   cold: $RUNNER_TEMP/bench-cache, emptied now and deleted by cleanup.sh (both sides).
#   warm: $HOME/.cache/codemany-bench/<project>, restored from actions/cache on BOTH sides.
#         2026-11-02: the bench repo is public, and Codemany runs a public repo's job on a
#         fresh, wiped machine (its "public twin"), so last night's folder is never on disk.
#         Each side keeps its own key: Codemany never builds with files GitHub saved.
# Same folder layout on both sides, so cold vs warm is the only difference that matters.
# Inputs (env): BENCH_PROJECT BENCH_MODE BENCH_LANG BENCH_SHA BENCH_TOOLCHAIN
set -euo pipefail

put() { echo "$1=$2" >> "$GITHUB_ENV"; }
src="${GITHUB_WORKSPACE:?}/src"

case "$BENCH_MODE" in
  cold) cache="${RUNNER_TEMP:?}/bench-cache"
        if [[ -d "$cache" ]]; then chmod -R u+w "$cache"; rm -rf "$cache"; fi ;;
  warm) cache="$HOME/.cache/codemany-bench/$BENCH_PROJECT" ;;
  *)    echo "::error::unknown mode '$BENCH_MODE'"; exit 1 ;;
esac
mkdir -p "$cache"
put BENCH_CACHE "$cache"
prefix="bench-v1"; [[ "${BENCH_SIDE:-}" == codemany ]] && prefix="bench-v1-codemany"
put BENCH_CACHE_KEY "$prefix-$BENCH_PROJECT-$BENCH_SHA-$RUNNER_OS-$RUNNER_ARCH"
put BENCH_SCRIPTS "$GITHUB_WORKSPACE/bench/scripts"

case "$BENCH_LANG" in
  Rust)
    put RUSTUP_TOOLCHAIN "$BENCH_TOOLCHAIN"
    put CARGO_HOME "$cache/cargo"          # crate downloads
    put CARGO_TARGET_DIR "$cache/target"   # compiled crates
    put CARGO_TERM_COLOR never ;;
  Go)
    put GOMODCACHE "$cache/gomod"
    put GOCACHE "$cache/gobuild"
    put GOFLAGS -modcacherw                # lets cleanup.sh delete the module cache
    put GOTOOLCHAIN local                  # never download a different Go mid-build
    put CGO_ENABLED 0                      # Hugo's standard (non-extended) release build
    put GOBIN "$RUNNER_TEMP/bin" ;;
  Next.js)
    put YARN_CACHE_FOLDER "$cache/yarn"
    put COREPACK_HOME "$cache/corepack"
    put COREPACK_ENABLE_DOWNLOAD_PROMPT 0
    put NEXT_TELEMETRY_DISABLED 1
    corepack enable                        # yarn version from package.json "packageManager"
    mkdir -p "$cache/next" "$src/.next"
    ln -sfn "$cache/next" "$src/.next/cache" ;;
  Node.js)                                 # TypeScript 7: npm + a Go compile (hereby)
    put npm_config_cache "$cache/npm"
    put npm_config_update_notifier false
    put GOMODCACHE "$cache/gomod"
    put GOCACHE "$cache/gobuild"
    put GOFLAGS -modcacherw
    put GOTOOLCHAIN local ;;
  Python)
    put PIP_CACHE_DIR "$cache/pip"
    put PIP_DISABLE_PIP_VERSION_CHECK 1
    put PYTHONUNBUFFERED 1 ;;
  iOS)                                     # xcodebuild caches go by flag (build.sh)
    put npm_config_cache "$cache/npm"
    put npm_config_update_notifier false ;;
  Android)
    put GRADLE_USER_HOME "$cache/gradle"           # wrapper, dependencies, build cache
    put ANDROID_USER_HOME "$cache/android-user"
    put GRADLE_OPTS "-Dorg.gradle.welcome=never" ;;
  C)                                       # Neovim: its deps dir is its cache (CI caches .deps)
    put DEPS_BUILD_DIR "$cache/deps"
    put CC gcc
    put CCACHE_DISABLE 1 ;;
  Docker)
    # A fresh BuildKit builder per job: base images are pulled on both sides.
    builder="bench-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT-$BENCH_PROJECT-$BENCH_MODE"
    docker buildx create --name "$builder" --driver docker-container --bootstrap >/dev/null
    put BENCH_BUILDER "$builder" ;;
  Swift) ;;
  *) echo "::error::unknown lang '$BENCH_LANG'"; exit 1 ;;
esac

# Print the machine and tool versions so every run log shows what it ran on.
# (`sed -n 1p` reads all input: `head -1` could SIGPIPE the tool and fail under pipefail.)
echo "machine: $(uname -sm), $(getconf _NPROCESSORS_ONLN) CPUs"
case "$BENCH_LANG" in
  Rust)    rustc --version ;;
  Go)      go version ;;
  Next.js) node --version ;;
  Node.js) node --version; go version ;;
  Python)  python --version ;;
  iOS)     xcodebuild -version | sed -n 1p; node --version ;;
  Android) java -version 2>&1 | sed -n 1p ;;
  C)       gcc --version | sed -n 1p; cmake --version | sed -n 1p ;;
  Docker)  docker version --format 'docker {{.Server.Version}}' ;;
  Swift)   xcodebuild -version | sed -n 1p; swift --version 2>&1 | sed -n 1p ;;
esac
