import { GateResult, SecurityFinding } from './types';

// ---------------------------------------------------------------------------
// Secret detection patterns — hard-coded, not overridable by prompt.
// ---------------------------------------------------------------------------

/** Regex patterns that identify hardcoded secrets in source files. */
export const SECRET_PATTERNS: ReadonlyArray<RegExp> = [
  /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([\w-]+)['"]/i,
  /['"]?secret['"]?\s*[:=]\s*['"]([\w-]+)['"]/i,
  /['"]?password['"]?\s*[:=]\s*['"]([\w-]+)['"]/i,
  /['"]?token['"]?\s*[:=]\s*['"]([\w-]+)['"]/i,
  /-----BEGIN\s+(RSA|EC|OPENSSH)\s+PRIVATE\s+KEY-----/
] as const;

const SENSITIVE_STORAGE_KEYWORDS = ['token', 'password', 'key'] as const;

/**
 * Returns true if the file content contains a hardcoded secret matching any
 * of the SECRET_PATTERNS above.
 */
export function detectHardcodedSecrets(content: string): boolean {
  return SECRET_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Returns true if the file content uses AsyncStorage to store sensitive data
 * (token, password, or key). Sensitive data must be stored in Keychain instead.
 */
export function detectInsecureStorage(content: string): boolean {
  return (
    content.includes('AsyncStorage') &&
    SENSITIVE_STORAGE_KEYWORDS.some(kw => content.includes(kw))
  );
}

/**
 * Placeholder for unvalidated-input detection.
 * Full implementation requires call-graph analysis to trace user input → API calls.
 * Returns false until AST-based analysis is wired in.
 */
export function detectUnvalidatedInput(_content: string): boolean {
  // TODO: implement call-graph analysis to trace user input → API calls without validation
  return false;
}

// Hard-coded enforcement thresholds — these cannot be overridden by prompt instructions.
const BLOCKING_SEVERITIES: ReadonlyArray<SecurityFinding['severity']> = [
  'critical',
  'high'
];
const ESCALATION_SEVERITIES: ReadonlyArray<SecurityFinding['severity']> = [
  'critical'
];

const FIX_TIME_MINUTES: Record<SecurityFinding['severity'], number> = {
  critical: 45,
  high: 20,
  medium: 10,
  low: 5
};

function estimateFixTime(findings: SecurityFinding[]): string {
  const minutes = findings.reduce(
    (sum, f) => sum + (FIX_TIME_MINUTES[f.severity] ?? 10),
    0
  );
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? '~1 hour' : `${hours}–${hours + 1} hours`;
}

/**
 * Deterministic gate enforcement for SDLC_G2.5_SECURITY.
 * Returns a typed GateResult — the orchestrator uses errorCategory to route retry logic.
 */
export function enforceSecurityGate(findings: SecurityFinding[]): GateResult {
  const blockingFindings = findings.filter(f =>
    BLOCKING_SEVERITIES.includes(f.severity)
  );
  const escalationFindings = findings.filter(f =>
    ESCALATION_SEVERITIES.includes(f.severity)
  );

  if (blockingFindings.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business', // Human must fix code — retrying is meaningless
      isRetryable: false,
      blockingIssues: blockingFindings.map(
        f =>
          `${f.id}: ${f.severity.toUpperCase()} — ${f.title} (${f.file}:${
            f.line
          })`
      ),
      escalationRequired: escalationFindings.length > 0,
      estimatedFixTime: estimateFixTime(blockingFindings),
      description:
        `Security gate blocked: ${blockingFindings.length} blocking finding(s) require ` +
        `manual remediation before pipeline can proceed.`
    };
  }

  if (findings.length > 0) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      warningIssues: findings.map(
        f => `${f.id}: ${f.severity.toUpperCase()} — ${f.title}`
      ),
      description: `Security audit: ${findings.length} non-blocking finding(s).`
    };
  }

  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'Security audit passed. No findings.'
  };
}
