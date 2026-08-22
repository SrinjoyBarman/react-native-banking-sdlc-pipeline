#!/bin/bash
# run-typecheck.sh — Run TypeScript check and capture exit code + output.
# Called by sdlc-g2.2-typecheck. Output written to pipeline-output/03-quality/.

set -euo pipefail

OUTPUT_DIR="pipeline-output/03-quality"
mkdir -p "$OUTPUT_DIR"

cd "$(git rev-parse --show-toplevel)"

npm run typecheck > "$OUTPUT_DIR/typecheck-raw.txt" 2>&1
EXIT_CODE=$?

echo "EXIT_CODE=$EXIT_CODE" >> "$OUTPUT_DIR/typecheck-raw.txt"
exit $EXIT_CODE
