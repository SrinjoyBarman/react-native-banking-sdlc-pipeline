import { GateResult } from './types';

// ---------------------------------------------------------------------------
// Shared input/output types
// ---------------------------------------------------------------------------

export interface SecurityAuditInput {
  manifest_path: string;
}

export interface AuditFileSecurityResult {
  file_path: string;
  findings: SecurityFindingRaw[];
}

export interface SecurityFindingRaw {
  check: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Step 1: Load security-sensitive files from change manifest
// ---------------------------------------------------------------------------

const SECURITY_SENSITIVE_CATEGORIES = ['core_logic', 'native_bridges'] as const;
const SECURITY_SENSITIVE_PATHS = ['auth', 'payment', 'storage', 'api'] as const;

export function filterSecuritySensitiveFiles(
  files: Array<{ path: string; category: string }>
): Array<{ path: string; category: string }> {
  return files.filter(
    f =>
      SECURITY_SENSITIVE_CATEGORIES.includes(
        f.category as (typeof SECURITY_SENSITIVE_CATEGORIES)[number]
      ) || SECURITY_SENSITIVE_PATHS.some(p => f.path.includes(p))
  );
}

// ---------------------------------------------------------------------------
// Step 2: Audit a single file across all security categories
// ---------------------------------------------------------------------------

/**
 * Runs all security checks against the content of a single file.
 * Imported detection helpers live in security-gate.enforcer.ts.
 * Domain-specific checks (auth, API, crypto, RN) are performed by the agent.
 */
export function buildAuditChecklist(file_path: string): string[] {
  const checks = [
    'detect_hardcoded_secrets',
    'detect_sensitive_logging',
    'detect_unvalidated_input',
    'detect_auth_issues',
    'detect_insecure_storage',
    'detect_crypto_issues',
    'detect_api_security_issues'
  ];

  if (/\.(tsx?|jsx?)$/.test(file_path)) {
    checks.push('detect_rn_security_issues');
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Step 3: Assemble gate result from collected findings
// ---------------------------------------------------------------------------

/**
 * Converts raw findings from all files into a GateResult.
 * Delegates to enforceSecurityGate from security-gate.enforcer.ts.
 */
export function summariseAudit(
  files_audited: number,
  findings: SecurityFindingRaw[]
): {
  files_audited: number;
  total_findings: number;
  by_severity: Record<string, number>;
} {
  const by_severity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  for (const f of findings) {
    by_severity[f.severity] = (by_severity[f.severity] ?? 0) + 1;
  }
  return { files_audited, total_findings: findings.length, by_severity };
}
