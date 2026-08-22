#!/bin/bash
# run-circular-deps.sh — Run madge circular dependency check per feature module.
# Called by sdlc-g2.4-circular-deps. Output written to pipeline-output/03-quality/.

set -euo pipefail

OUTPUT_DIR="pipeline-output/03-quality"
mkdir -p "$OUTPUT_DIR"

cd "$(git rev-parse --show-toplevel)"

echo "Checking circular dependencies..." | tee "$OUTPUT_DIR/circular-deps-raw.txt"

MODULES=("core" "shared" "auth" "dashboard" "payments" "cards" "profile" "storage" "store" "onboarding")

EXIT_CODE=0
for module in "${MODULES[@]}"; do
  echo "Checking src/$module..." | tee -a "$OUTPUT_DIR/circular-deps-raw.txt"
  npx madge --circular --extensions ts,tsx "src/$module" >> "$OUTPUT_DIR/circular-deps-raw.txt" 2>&1 || EXIT_CODE=1
done

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No circular dependencies detected" | tee -a "$OUTPUT_DIR/circular-deps-raw.txt"
else
  echo "❌ Circular dependencies found" | tee -a "$OUTPUT_DIR/circular-deps-raw.txt"
fi

exit $EXIT_CODE
