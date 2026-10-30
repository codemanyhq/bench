#!/usr/bin/env bash
# Turns data/projects.json into the bench matrices, printed as GitHub step outputs (2026-10-30).
#   github = every project × {cold, warm}; linux / macos = the Codemany halves by OS.
# Keeping the matrix in projects.json means the pinned SHAs live in exactly one place.
set -euo pipefail
file="${1:-data/projects.json}"

# $1 = jq condition that picks projects.
matrix() {
  jq -c "[.[] | select($1)
    | {project: .id, repo, sha, lang, os, toolchain} as \$p
    | (\"cold\", \"warm\") | \$p + {mode: .}]" "$file"
}

echo "github=$(matrix 'true')"
echo "linux=$(matrix '.os == "linux"')"
echo "macos=$(matrix '.os == "macos"')"
