#!/usr/bin/env bash
# Run generated acceptance journeys in .testmuai/tests/ as one suite.
# Usage: scripts/run-suite.sh [parallel-workers] [extra testrun flags...]
# Strict by default (no adaptive heal): a replay miss fails instead of re-authoring.
set -euo pipefail

cd "$(dirname "$0")/.."
workers="${1:-4}"
[ "$#" -gt 0 ] && shift

# testrun takes file paths (not folders) and must not read stdin.
files=()
for file in .testmuai/tests/*_test.md; do
  # The PoC landing smoke is historical; current entry uses website selection.
  [[ "$file" == *raising-kane-smoke_test.md ]] && continue
  [[ -f "$file" ]] && files+=("$file")
done
if [[ ${#files[@]} -eq 0 ]]; then
  echo 'No current generated acceptance journeys found.' >&2
  exit 2
fi
exec kane-cli testrun run "${files[@]}" \
  --parallel "$workers" --no-adaptive-heal --headless --agent "$@" < /dev/null
