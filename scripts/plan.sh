#!/usr/bin/env bash
# Turns data/projects.json into the bench matrices, printed as GitHub step outputs (2026-10-30).
#   github_cold / github_warm = every project, one mode each (2026-11-02: GitHub's warm
#   jobs wait for all cold jobs, whose saves they restore; see bench.yml);
#   linux / macos = the Codemany halves by OS, each project's cold right before its warm.
# Keeping the matrix in projects.json means the pinned SHAs live in exactly one place.
set -euo pipefail
file="${1:-data/projects.json}"

# $1 = jq condition that picks projects; $2 = jq stream of modes, in order.
matrix() {
  jq -c "[.[] | select($1)
    | {project: .id, repo, sha, lang, os, toolchain} as \$p
    | ($2) | \$p + {mode: .}]" "$file"
}

echo "github_cold=$(matrix 'true' '"cold"')"
echo "github_warm=$(matrix 'true' '"warm"')"
echo "linux=$(matrix '.os == "linux"' '"cold", "warm"')"
echo "macos=$(matrix '.os == "macos"' '"cold", "warm"')"
