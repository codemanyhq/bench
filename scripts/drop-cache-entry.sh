#!/usr/bin/env bash
# Deletes this run's used cache entry from GitHub's cache (prepare, "drop used cache entry").
# Per-run entries are read once; dropping them keeps the next projects' saves from pushing
# an unread entry out of GitHub's 10 GB per repo (env.sh).
#
# 2026-11-07 (CMY-97): HTTP 404 means "no such entry", so it is logged, not warned. That is
# every Codemany warm job: Codemany's job cache answers actions/cache, so the entry never
# reaches GitHub's cache API (and GitHub's 10 GB limit doesn't apply to it). On GitHub it
# means the entry is already gone. Any other failure still warns: bench.yml's plan job
# sweeps leftovers next run, so a failed delete must not fail a measured build.
# Inputs (env): GH_TOKEN BENCH_CACHE_KEY GITHUB_API_URL GITHUB_REPOSITORY
set -uo pipefail

: "${GH_TOKEN:?}" "${BENCH_CACHE_KEY:?}" "${GITHUB_API_URL:?}" "${GITHUB_REPOSITORY:?}"

# -w prints the status even on 4xx/5xx (no -f); curl itself failing leaves "000".
code=$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE -G \
  -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  --data-urlencode "key=$BENCH_CACHE_KEY" \
  "$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/actions/caches") || code="${code:-000}"

case "$code" in
  2??) echo "deleted cache entry $BENCH_CACHE_KEY" ;;
  404) echo "no GitHub cache entry $BENCH_CACHE_KEY (nothing to delete)" ;;
  *)   echo "::warning::could not delete cache entry $BENCH_CACHE_KEY (HTTP $code)" ;;
esac
exit 0
