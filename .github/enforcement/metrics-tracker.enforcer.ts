// ---------------------------------------------------------------------------
// Metrics tracker types and action contracts.
// All actions are invoked by sdlc-pipeline-orchestrator via invoke_agent('metrics-tracker', { action, ... }).
// The session state is persisted to /memories/session/metrics.json.
// Historical aggregates are appended to /memories/repo/pipeline-metrics.md.
// ---------------------------------------------------------------------------

export interface TokenCounts {
  input: number;
  output: number;
  cache_read: number;
  cache_new: number;
  total: number;
}

export interface AgentMetrics {
  agent_name: string;
  gate_id: string;
  phase: string;
  skill?: string;
  model: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  tokens?: TokenCounts;
  estimated_cost?: number;
  attributed_entries?: number;
  status?: 'success' | 'failure' | 'skipped';
  gate_result?: string;
}

export interface GateMetrics {
  gate_id: string;
  gate_name: string;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  tokens_total?: number;
  estimated_cost?: number;
  status?: string;
}

export interface SessionMetrics {
  pipeline_run_id: string;
  started_at: string;
  ended_at: string | null;
  status: 'in_progress' | 'success' | 'failure' | 'aborted' | 'blocked';
  total_tokens: TokenCounts;
  total_time_ms: number;
  estimated_cost: number;
  agents: AgentMetrics[];
  gates: GateMetrics[];
  standalone_agents?: StandaloneAgentEntry[];
}

export interface StandaloneAgentEntry {
  agent: string;
  timestamp: string;
  estimated_tokens: {
    input: number;
    output: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Action: initialize
// ---------------------------------------------------------------------------

/** Create new session metrics and persist to /memories/session/metrics.json. */
export interface InitializeAction {
  action: 'initialize';
  pipeline_run_id: string;
  trigger: 'auto_detect' | 'manual';
  change_manifest?: unknown;
  user_request?: string;
}

// ---------------------------------------------------------------------------
// Action: record_agent_start
// ---------------------------------------------------------------------------

export interface RecordAgentStartAction {
  action: 'record_agent_start';
  pipeline_run_id: string;
  agent_name: string;
  gate_id: string;
  phase: string;
  skill?: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Action: record_agent_completion
// ---------------------------------------------------------------------------

export interface RecordAgentCompletionAction {
  action: 'record_agent_completion';
  pipeline_run_id: string;
  agent_name: string;
  tokens: Omit<TokenCounts, 'total'>;
  attributed_entries: number;
  status: 'success' | 'failure' | 'skipped';
  gate_result?: string;
}

// ---------------------------------------------------------------------------
// Action: record_gate_completion
// ---------------------------------------------------------------------------

export interface RecordGateCompletionAction {
  action: 'record_gate_completion';
  pipeline_run_id: string;
  gate_id: string;
  gate_name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'WARNED';
}

// ---------------------------------------------------------------------------
// Action: finalize
// ---------------------------------------------------------------------------

export interface FinalizeAction {
  action: 'finalize';
  pipeline_run_id: string;
  status: 'success' | 'failure' | 'aborted';
}

// ---------------------------------------------------------------------------
// Action: get_current_metrics
// ---------------------------------------------------------------------------

export interface GetCurrentMetricsAction {
  action: 'get_current_metrics';
  pipeline_run_id: string;
}

export interface GetCurrentMetricsResult {
  session_metrics: SessionMetrics;
  formatted_summary: string; // Markdown table
}

// ---------------------------------------------------------------------------
// Cost calculation formulas
// ---------------------------------------------------------------------------

/**
 * Estimate cost for a single agent run.
 * Rates are sourced from pipeline-config.yaml models section at runtime.
 */
export function estimateAgentCost(
  tokens: TokenCounts,
  rates: {
    input_per_1k: number;
    output_per_1k: number;
    cache_write_per_1k: number;
    cache_read_per_1k: number;
  }
): number {
  return (
    (tokens.input * rates.input_per_1k) / 1000 +
    (tokens.output * rates.output_per_1k) / 1000 +
    (tokens.cache_new * rates.cache_write_per_1k) / 1000 +
    (tokens.cache_read * rates.cache_read_per_1k) / 1000
  );
}

/** Cache hit rate as a percentage (0-100). */
export function cacheHitRate(tokens: TokenCounts): number {
  const denominator = tokens.input + tokens.cache_read;
  return denominator === 0 ? 0 : (tokens.cache_read / denominator) * 100;
}

/**
 * Default cost estimate for standalone agents (Sonnet 4.6 rates).
 * Used by standalone summary mode when pipeline rates are unavailable.
 */
export function estimateStandaloneCost(
  input_tokens: number,
  output_tokens: number
): number {
  return (input_tokens * 0.003) / 1000 + (output_tokens * 0.015) / 1000;
}
