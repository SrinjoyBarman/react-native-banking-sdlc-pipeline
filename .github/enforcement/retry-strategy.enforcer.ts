import { ErrorCategory, RetryStrategy, GateResult } from './types';

/**
 * Error-category-to-strategy map for the pipeline orchestrator.
 * Determines whether to retry, invoke a fix agent, block, or escalate.
 *
 * transient  — tool/network failure, retry with exponential backoff
 * validation — attention dilution or config mismatch, retry once after fix
 * business   — code defects (type errors, security issues) — human must fix, never retry
 * permission — access denied — escalate to human immediately
 */
export const RETRY_STRATEGY: Readonly<Record<ErrorCategory, RetryStrategy>> = {
  transient: {
    shouldRetry: true,
    maxRetries: 3,
    backoffMs: 1000,
    action: 'retry_immediately'
  },
  validation: {
    shouldRetry: true,
    maxRetries: 1,
    backoffMs: 0,
    action: 'retry_with_fix'
  },
  business: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMs: 0,
    action: 'block_and_escalate'
  },
  permission: {
    shouldRetry: false,
    maxRetries: 0,
    backoffMs: 0,
    action: 'escalate_to_human'
  }
} as const;

/**
 * Returns the retry strategy for a given gate result.
 * Defaults to 'business' (most conservative) when errorCategory is missing.
 */
export function getRetryStrategy(result: GateResult): RetryStrategy {
  const category = result.errorCategory ?? 'business';
  return RETRY_STRATEGY[category];
}

/**
 * Returns true when the pipeline should halt and wait for human intervention.
 */
export function shouldBlockPipeline(result: GateResult): boolean {
  return result.isError && !result.isRetryable;
}

/**
 * Parses a structured GateResult from an agent's raw text output.
 *
 * Agents embed their result in a ```json block. If parsing fails, the failure
 * is treated as a transient error (agent timeout or unexpected crash) and the
 * orchestrator will retry according to the transient strategy above.
 */
export function parseAgentResult(
  rawText: string | undefined,
  agentName: string
): GateResult {
  try {
    const jsonMatch = rawText?.match(/```json\n([\s\S]+?)\n```/);
    if (jsonMatch?.[1]) {
      return JSON.parse(jsonMatch[1]) as GateResult;
    }
  } catch {
    // Fall through to transient error
  }

  return {
    status: 'ERROR',
    isError: true,
    errorCategory: 'transient',
    isRetryable: true,
    description: `Agent ${agentName} returned unparseable response. Will retry.`
  };
}
