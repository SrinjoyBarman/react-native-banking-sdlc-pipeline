#!/bin/bash
# run-change-detect.sh — Detect git changes relative to the previous commit.
# Called by change-detector. Output written to pipeline-output/.

set -euo pipefail

OUTPUT_DIR="pipeline-output"
mkdir -p "$OUTPUT_DIR"

# Navigate to repo root (one level up from  workspace root)
REPO_ROOT=$(git -C "$(pwd)" rev-parse --show-toplevel)

# Changed files with status (A/M/D/R/C)
git -C "$REPO_ROOT" diff --name-status HEAD@{1} HEAD > "$OUTPUT_DIR/changed-files.txt" 2>&1 || \
  git -C "$REPO_ROOT" diff --name-status HEAD~1 HEAD > "$OUTPUT_DIR/changed-files.txt" 2>&1

# Line count stats
git -C "$REPO_ROOT" diff --stat HEAD@{1} HEAD > "$OUTPUT_DIR/diff-stats.txt" 2>&1 || \
  git -C "$REPO_ROOT" diff --stat HEAD~1 HEAD > "$OUTPUT_DIR/diff-stats.txt" 2>&1

# Numeric stats (lines added/removed per file)
git -C "$REPO_ROOT" diff --numstat HEAD@{1} HEAD > "$OUTPUT_DIR/diff-numstat.txt" 2>&1 || \
  git -C "$REPO_ROOT" diff --numstat HEAD~1 HEAD > "$OUTPUT_DIR/diff-numstat.txt" 2>&1

# Current status (staged + unstaged)
git -C "$REPO_ROOT" status --porcelain > "$OUTPUT_DIR/git-status.txt" 2>&1

echo "Change detection complete. Results in $OUTPUT_DIR/"
