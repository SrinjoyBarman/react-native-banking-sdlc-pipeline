#!/bin/bash
# run-sdlc-g4-test-executor.sh — Run Jest with coverage for a given feature module.
# Usage: ./run-sdlc-g4-test-executor.sh <module_name>   e.g. payments
# Called by sdlc-g4-test-executor. Output written to pipeline-output/06-testing/.

set -euo pipefail

MODULE=${1:-""}
OUTPUT_DIR="pipeline-output/06-testing"
LEGACY_OUTPUT_DIR="pipeline-output/05-testing"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LEGACY_OUTPUT_DIR"

cd "$(git rev-parse --show-toplevel)"

# Check for skipped/focused tests (should fail CI)
if grep -rn '\.skip\|\.only' "src/$MODULE"/**/*.test.* 2>/dev/null; then
  echo "WARNING: skipped or focused tests found" | tee -a "$OUTPUT_DIR/test-warnings.txt"
fi

if [ -z "$MODULE" ]; then
  # Run all tests
  npx jest --coverage \
    --coverageReporters json summary \
    --outputFile "$OUTPUT_DIR/jest-raw.txt" \
    2>&1 | tee "$OUTPUT_DIR/jest-output.txt"
else
  # Run for specific module
  npx jest --coverage \
    --collectCoverageFrom="src/$MODULE/**/*.{ts,tsx}" \
    --testPathPattern="src/$MODULE/" \
    --coverageReporters json summary \
    2>&1 | tee "$OUTPUT_DIR/jest-output.txt"
fi

EXIT_CODE=$?

# Copy coverage summary
cp coverage/coverage-summary.json "$OUTPUT_DIR/coverage-summary.json" 2>/dev/null || true

# Backward compatibility for older agents that still read 05-testing.
cp "$OUTPUT_DIR/jest-output.txt" "$LEGACY_OUTPUT_DIR/jest-output.txt" 2>/dev/null || true
cp "$OUTPUT_DIR/coverage-summary.json" "$LEGACY_OUTPUT_DIR/coverage-summary.json" 2>/dev/null || true

exit $EXIT_CODE
