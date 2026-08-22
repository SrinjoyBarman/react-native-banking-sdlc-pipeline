import {
  FileReview,
  EqualDepthResult,
  GateResult,
  IntegrationIssue
} from './types';

// Hard-coded thresholds — must match values documented in pipeline-config.yaml
const VARIANCE_THRESHOLD = 15; // Maximum allowed token variance % across files
const SHALLOW_FILE_THRESHOLD = 0.85; // Files below 85% of average are flagged as shallow
const SYSTEMIC_PATTERN_MIN = 3; // Same bug type in ≥3 files = systemic issue

/**
 * Programmatic enforcement of equal-depth analysis for SDLC_G3_REVIEW.
 *
 * If token variance across reviewed files exceeds VARIANCE_THRESHOLD, this returns
 * a validation error listing the shallow files so the orchestrator can re-review them.
 * This is deterministic — it cannot be bypassed by prompt instructions.
 */
export function enforceEqualDepth(fileReviews: FileReview[]): EqualDepthResult {
  if (fileReviews.length === 0) {
    return {
      passed: true,
      isError: false,
      variance_percentage: 0,
      shallow_files: []
    };
  }

  const tokensPerFile = fileReviews.map(r => r.tokens_used);
  const avgTokens =
    tokensPerFile.reduce((a, b) => a + b, 0) / tokensPerFile.length;
  const maxTokens = Math.max(...tokensPerFile);
  const minTokens = Math.min(...tokensPerFile);
  const variancePct = ((maxTokens - minTokens) / avgTokens) * 100;

  if (variancePct >= VARIANCE_THRESHOLD) {
    const shallowFiles = fileReviews
      .filter(r => r.tokens_used < avgTokens * SHALLOW_FILE_THRESHOLD)
      .map(r => ({
        file: r.file_path,
        tokens: r.tokens_used,
        deficit_pct: Math.round((1 - r.tokens_used / avgTokens) * 100)
      }));

    return {
      passed: false,
      isError: true,
      errorCategory: 'validation',
      isRetryable: true,
      variance_percentage: Math.round(variancePct),
      shallow_files: shallowFiles,
      description:
        `Attention dilution detected: ${shallowFiles.length} file(s) received ` +
        `<${Math.round(
          SHALLOW_FILE_THRESHOLD * 100
        )}% of average token allocation. ` +
        `Re-reviewing: ${shallowFiles.map(f => f.file).join(', ')}`
    };
  }

  return {
    passed: true,
    isError: false,
    variance_percentage: Math.round(variancePct),
    shallow_files: []
  };
}

// ---------------------------------------------------------------------------
// Cross-file integration pass helpers
// These are placeholder implementations — extend with real AST analysis.
// ---------------------------------------------------------------------------

interface TypeExport {
  file: string;
  symbol: string;
  shape: Record<string, unknown>;
}
interface TypeUsage {
  file: string;
  symbol: string;
  line: number;
  shape: Record<string, unknown>;
}

function extractTypeExports(
  _reviews: FileReview[]
): Record<string, TypeExport> {
  return {}; // TODO: extend with TypeScript AST parser
}

function extractTypeUsages(_reviews: FileReview[]): Record<string, TypeUsage> {
  return {}; // TODO: extend with TypeScript AST parser
}

function isCompatible(_usage: TypeUsage, _contract: TypeExport): boolean {
  return true; // TODO: extend with structural type comparison
}

function hasDownstreamErrorHandler(
  _source: { file: string; line: number },
  _reviews: FileReview[]
): boolean {
  return false; // TODO: extend with call-graph analysis
}

/**
 * Second-pass cross-file analysis executed after all per-file reviews complete.
 * Detects systemic patterns, type contract violations, and missing error propagation
 * that single-file analysis misses.
 */
export function crossFileIntegrationPass(fileReviews: FileReview[]): {
  integration_issues: IntegrationIssue[];
  files_analyzed: number;
} {
  const integrationIssues: IntegrationIssue[] = [];

  // 1. Systemic bug patterns — same bug type in SYSTEMIC_PATTERN_MIN or more files
  const bugTypes = fileReviews.flatMap(r => r.bugs.map(b => b.type));
  const typeFrequency = bugTypes.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  for (const [bugType, count] of Object.entries(typeFrequency)) {
    if (count >= SYSTEMIC_PATTERN_MIN) {
      integrationIssues.push({
        type: 'systemic_pattern',
        bug_type: bugType,
        occurrence_count: count,
        affected_files: fileReviews
          .filter(r => r.bugs.some(b => b.type === bugType))
          .map(r => r.file_path),
        recommendation: `${bugType} appears in ${count} files — consider a shared fix or ESLint rule`
      });
    }
  }

  // 2. Cross-file type contract violations
  const typeExports = extractTypeExports(fileReviews);
  const typeUsages = extractTypeUsages(fileReviews);
  for (const [symbol, usage] of Object.entries(typeUsages)) {
    const contract = typeExports[symbol];
    if (contract && !isCompatible(usage, contract)) {
      integrationIssues.push({
        type: 'type_contract_violation',
        symbol,
        defined_in: contract.file,
        violated_in: usage.file,
        line: usage.line
      });
    }
  }

  // 3. Missing error propagation chains
  const errorSources = fileReviews.flatMap(r =>
    r.bugs
      .filter(b => b.type === 'Error Handling')
      .map(b => ({ file: r.file_path, line: b.line }))
  );
  for (const source of errorSources) {
    if (!hasDownstreamErrorHandler(source, fileReviews)) {
      integrationIssues.push({
        type: 'missing_error_propagation',
        source_file: source.file,
        source_line: source.line,
        recommendation: 'Error not caught or propagated to UI error boundary'
      });
    }
  }

  return {
    integration_issues: integrationIssues,
    files_analyzed: fileReviews.length
  };
}

// ---------------------------------------------------------------------------
// Gate result enforcement — SDLC_G3_REVIEW
// Hard-coded thresholds. Cannot be overridden by prompt instructions.
// ---------------------------------------------------------------------------

const CRITICAL_BUG_WARN_THRESHOLD = 0; // Any critical bug = WARN
const MAJOR_BUG_WARN_THRESHOLD = 5; // >5 major bugs = WARN

/**
 * Deterministic gate enforcement for SDLC_G3_REVIEW.
 * Combines equal-depth validation with bug count threshold checks.
 * Equal-depth failures are retryable (re-review shallow files first).
 * Bug threshold violations are non-blocking WARNs.
 */
export function enforceReviewGate(
  fileReviews: FileReview[],
  criticalBugs: number,
  majorBugs: number
): GateResult {
  const depthResult = enforceEqualDepth(fileReviews);

  if (depthResult.isError) {
    return {
      status: 'ERROR',
      isError: true,
      errorCategory: 'validation',
      isRetryable: true,
      description:
        depthResult.description ??
        'Equal depth validation failed — re-review shallow files.'
    };
  }

  if (criticalBugs > CRITICAL_BUG_WARN_THRESHOLD) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: `${criticalBugs} critical bug(s) found. Non-blocking but must be addressed before merge.`
    };
  }

  if (majorBugs > MAJOR_BUG_WARN_THRESHOLD) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: `${majorBugs} major bug(s) found (threshold: ${MAJOR_BUG_WARN_THRESHOLD}).`
    };
  }

  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'Review gate passed.'
  };
}
