import { GateResult, LintViolation } from './types';

/**
 * Deterministic gate enforcement for SDLC_G2.1_LINT.
 * Errors block the pipeline (business error); warnings produce WARN (non-blocking).
 */
export function enforceLintGate(
  errors: LintViolation[],
  warnings: LintViolation[]
): GateResult {
  if (errors.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      blockingIssues: errors.map(
        e => `${e.file}:${e.line}:${e.column} [${e.rule}] ${e.message}`
      ),
      description: `Lint: ${errors.length} error(s) must be fixed before pipeline can proceed.`
    };
  }

  if (warnings.length > 0) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: `Lint: ${warnings.length} warning(s) found (non-blocking).`
    };
  }

  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'Lint passed. No errors or warnings.'
  };
}
