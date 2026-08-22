#!/bin/bash
# run-lint.sh — Run ESLint on specified files or all TS/TSX files.
# Usage: ./run-lint.sh [--fix] [file1 file2 ...]
# Called by sdlc-g2.1-lint. Output written to pipeline-output/03-quality/.

set -euo pipefail

OUTPUT_DIR="pipeline-output/03-quality"
mkdir -p "$OUTPUT_DIR"

cd "$(git rev-parse --show-toplevel)"

FIX_FLAG=""
FILES=()

for arg in "$@"; do
  if [ "$arg" = "--fix" ]; then
    FIX_FLAG="--fix"
  else
    FILES+=("$arg")
  fi
done

if [ ${#FILES[@]} -eq 0 ]; then
  TARGET="src/**/*.{ts,tsx}"
else
  TARGET="${FILES[*]}"
fi

# Run ESLint with JSON output
npx eslint $FIX_FLAG --format json --output-file "$OUTPUT_DIR/eslint-raw.json" $TARGET 2>&1 || true

EXIT_CODE=$?

echo "Lint complete. Check $OUTPUT_DIR/eslint-raw.json for results."
exit $EXIT_CODE
