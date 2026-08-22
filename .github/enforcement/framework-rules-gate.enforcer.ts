import { GateResult, FrameworkViolation } from './types';

/**
 * Deterministic gate enforcement for SDLC_G2.3_FRAMEWORK_RULES.
 * Critical violations (module boundary, state management, or API chain rules) block the pipeline.
 * Major/minor violations produce a warning.
 *
 * API chain rules (v2.2.0):
 *   critical — direct axios/ApiService calls from hooks/components; inline state selectors in components
 *   major   — missing 'idle' in loading state; sagas calling ApiService without service abstraction
 */
export function enforceFrameworkRulesGate(
  violations: FrameworkViolation[]
): GateResult {
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  const majorViolations = violations.filter(v => v.severity === 'major');
  const minorViolations = violations.filter(v => v.severity === 'minor');

  if (criticalViolations.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      blockingIssues: criticalViolations.map(
        v => `${v.file}:${v.line} [${v.rule}] ${v.message}`
      ),
      description:
        `Framework rules: ${criticalViolations.length} critical violation(s) ` +
        `(module boundary, state management, or API chain).`
    };
  }

  if (majorViolations.length > 0 || minorViolations.length > 0) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description:
        `Framework rules: ${majorViolations.length} major + ` +
        `${minorViolations.length} minor violation(s) (non-blocking).`
    };
  }

  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'Framework rules passed. No violations.'
  };
}
