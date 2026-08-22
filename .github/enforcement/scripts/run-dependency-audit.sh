#!/bin/bash
# run-dependency-audit.sh — Run npm audit for production deps only.
# Called by sdlc-g7-dependency-auditor. Output written to pipeline-output/07-audits/.

set -euo pipefail

OUTPUT_DIR="pipeline-output/07-audits"
LEGACY_OUTPUT_DIR="pipeline-output/06-audits"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LEGACY_OUTPUT_DIR"

cd "$(git rev-parse --show-toplevel)"

# Full JSON output
npm audit --production --json > "$OUTPUT_DIR/npm-audit-raw.json" 2>&1 || true

# Extract Critical/High entries for quick scan
cat "$OUTPUT_DIR/npm-audit-raw.json" | \
  jq '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | { name: .key, severity: .value.severity, range: .value.range, fixAvailable: .value.fixAvailable }' \
  > "$OUTPUT_DIR/npm-audit-blocking.json" 2>/dev/null || echo "[]" > "$OUTPUT_DIR/npm-audit-blocking.json"

# List only production deps for reference
cat package.json | jq '.dependencies | keys' > "$OUTPUT_DIR/production-deps.json" 2>/dev/null || true

# Backward compatibility for older agents that still read 06-audits.
cp "$OUTPUT_DIR/npm-audit-raw.json" "$LEGACY_OUTPUT_DIR/npm-audit-raw.json" 2>/dev/null || true
cp "$OUTPUT_DIR/npm-audit-blocking.json" "$LEGACY_OUTPUT_DIR/npm-audit-blocking.json" 2>/dev/null || true
cp "$OUTPUT_DIR/production-deps.json" "$LEGACY_OUTPUT_DIR/production-deps.json" 2>/dev/null || true

echo "Audit complete. Check $OUTPUT_DIR/npm-audit-raw.json for full results."
