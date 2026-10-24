#!/usr/bin/env bash
# Raising Kane: generated regression tests, with a mandatory plan and variable check.
# Usage: scripts/run-suite.sh [parallel-workers] [--suite ui|public|all] [--dry-run]
# See npm run verify:kane:suite -- --help for the supported options.
set -euo pipefail

cd "$(dirname "$0")/.."
exec node scripts/kane-suite.mjs "$@" < /dev/null
