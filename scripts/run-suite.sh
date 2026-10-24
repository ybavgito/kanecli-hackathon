#!/usr/bin/env bash
# Run every *_test.md under tests/ as one parallel suite.
# Usage: scripts/run-suite.sh [parallel-workers] [extra testrun flags...]
# Strict by default (no adaptive heal): a replay miss fails instead of re-authoring.
set -euo pipefail

cd "$(dirname "$0")/.."
workers="${1:-4}"
[ "$#" -gt 0 ] && shift

# testrun takes file paths (not folders) and must not read stdin.
exec kane-cli testrun run tests/*_test.md \
  --parallel "$workers" --no-adaptive-heal --headless --agent "$@" < /dev/null
