#!/usr/bin/env bash
# `docker build -t <tag> .` for the bench (2026-10-30), run inside ./src.
# Uses the fresh builder from env.sh, so nothing is left over from earlier jobs.
#   cold: --no-cache.
#   warm: layers imported from / exported to $BENCH_CACHE/buildx (same on both sides).
set -euo pipefail
tag="bench/${1:?usage: docker-build.sh <tag>}"
args=(buildx build --builder "${BENCH_BUILDER:?}" --load -t "$tag")

if [[ "$BENCH_MODE" == cold ]]; then
  args+=(--no-cache)
else
  if [[ -d "$BENCH_CACHE/buildx" ]]; then
    args+=(--cache-from "type=local,src=$BENCH_CACHE/buildx")
  fi
  args+=(--cache-to "type=local,dest=$BENCH_CACHE/buildx-next,mode=max")
fi

docker "${args[@]}" .

# Swap in the new cache only after a good build.
if [[ "$BENCH_MODE" == warm ]]; then
  rm -rf "$BENCH_CACHE/buildx"
  mv "$BENCH_CACHE/buildx-next" "$BENCH_CACHE/buildx"
fi
