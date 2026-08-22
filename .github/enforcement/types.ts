// Shared types for all programmatic gate enforcement modules.
// These are the canonical contracts between agents and the pipeline orchestrator.

export type ErrorCategory =
  | 'transient'
  | 'validation'
  | 'business'
  | 'permission';
export type GateStatus = 'PASSED' | 'WARN' | 'FAILED' | 'ERROR' | 'BLOCKED';

export interface GateResult {
  status: GateStatus;
  isError: boolean;
  errorCategory: ErrorCategory | null;
  isRetryable: boolean;
  blockingIssues?: string[];
  warningIssues?: string[];
  escalationRequired?: boolean;
  estimatedFixTime?: string;
  description: string;
}

export interface SecurityFinding {
  id: string;
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  category: string;
  cwe?: string;
  owasp?: string;
  description: string;
  fix: string;
}

export interface LintViolation {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface TypeScriptError {
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
}

export interface CircularCycle {
  module: string;
  depth: number;
  chain: string[];
}

export interface FrameworkViolation {
  file: string;
  line: number;
  rule: string;
  severity: 'critical' | 'major' | 'minor';
  message: string;
  suggestion: string;
}

export interface ImportViolation {
  importer: string;
  imported: string;
  reason: string;
  type: 'invalid_direction' | 'deep_import';
}

export interface ReviewBug {
  id: number;
  line: number;
  severity: 'critical' | 'major' | 'minor';
  type: string;
  description: string;
  code_snippet: string;
  impact: string;
  fix_suggestion: string;
}

export interface FileReview {
  file_path: string;
  line_count: number;
  bugs_found: number;
  bugs: ReviewBug[];
  tokens_used: number;
  review_depth: string;
}

export interface ShallowFile {
  file: string;
  tokens: number;
  deficit_pct: number;
}

export interface EqualDepthResult {
  passed: boolean;
  isError: boolean;
  errorCategory?: ErrorCategory;
  isRetryable?: boolean;
  variance_percentage: number;
  shallow_files: ShallowFile[];
  description?: string;
}

export interface IntegrationIssue {
  type:
    | 'systemic_pattern'
    | 'type_contract_violation'
    | 'missing_error_propagation';
  [key: string]: unknown;
}

export interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  backoffMs: number;
  action:
    | 'retry_immediately'
    | 'retry_with_fix'
    | 'block_and_escalate'
    | 'escalate_to_human';
}
