import { GateResult, GateStatus } from './types';
import { getRetryStrategy, parseAgentResult } from './retry-strategy.enforcer';
import {
  loadSharedContext,
  extractContextForAgent,
  generateContextPrompt,
  calculateTokenSavings,
  SharedContext,
  ContextExtract
} from './context-manager.enforcer';

// ---------------------------------------------------------------------------
// Shared type definitions
// ---------------------------------------------------------------------------

export interface Gate {
  id: string;
  name: string;
  phase: string;
  blocking: boolean;
  agents: string[];
  model: string;
  max_fix_iterations: number;
  parallel_gates?: string[];
}

export interface PipelineState {
  pipeline_run_id: string;
  started_at: string;
  trigger: string;
  current_gate: string | null;
  current_status: string;
  gates_completed: string[];
  gates_failed: string[];
  gates_warned: string[];
  fix_iterations: Record<string, number>;
  user_responses?: Record<string, string>;
  feature_description?: string;
  change_manifest_path?: string;
}

const OUTPUT_DIRS = {
  canonical: [
    'pipeline-output',
    'pipeline-output/00-requirements',
    'pipeline-output/01-plan',
    'pipeline-output/02-implementation',
    'pipeline-output/03-quality',
    'pipeline-output/04-security',
    'pipeline-output/05-review',
    'pipeline-output/06-testing',
    'pipeline-output/07-audits',
    'pipeline-output/08-reports'
  ],
  legacy: [
    'pipeline-output/01-planning',
    'pipeline-output/04-review',
    'pipeline-output/05-testing',
    'pipeline-output/06-audits',
    'pipeline-output/07-reports'
  ]
} as const;

const phaseToOutputDir = (phase: string): string => {
  switch (phase) {
    case 'pre-stage':
      return 'pipeline-output/00-requirements';
    case 'planning':
      return 'pipeline-output/01-plan';
    case 'implementation':
      return 'pipeline-output/02-implementation';
    case 'quality':
      return 'pipeline-output/03-quality';
    case 'review':
      return 'pipeline-output/05-review';
    case 'testing':
      return 'pipeline-output/06-testing';
    case 'audit':
      return 'pipeline-output/07-audits';
    case 'post-stage':
      return 'pipeline-output/08-reports';
    default:
      return 'pipeline-output';
  }
};

async function ensureOutputDirs(
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>
): Promise<void> {
  const dirs = [...OUTPUT_DIRS.canonical, ...OUTPUT_DIRS.legacy];
  await invoke_agent('execute', {
    command: `mkdir -p ${dirs.join(' ')}`,
    explanation:
      'Create canonical and legacy pipeline-output directories to prevent write failures from mixed agent path conventions.'
  });
}

async function reconcileOutputAliases(
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>
): Promise<void> {
  const syncCommand = [
    "if [ -f pipeline-output/01-plan/feature-plan.md ] && [ ! -f pipeline-output/feature-plan.md ]; then cp pipeline-output/01-plan/feature-plan.md pipeline-output/feature-plan.md; fi",
    "if [ -f pipeline-output/01-planning/requirements-traceability.md ] && [ ! -f pipeline-output/01-plan/requirements-traceability.md ]; then cp pipeline-output/01-planning/requirements-traceability.md pipeline-output/01-plan/requirements-traceability.md; fi",
    "if [ -f pipeline-output/01-plan/requirements-traceability.md ] && [ ! -f pipeline-output/01-planning/requirements-traceability.md ]; then cp pipeline-output/01-plan/requirements-traceability.md pipeline-output/01-planning/requirements-traceability.md; fi",
    "if [ -f pipeline-output/02-implementation/implementation-manifest.md ] && [ ! -f pipeline-output/02-implementation/implementation_manifest.md ]; then cp pipeline-output/02-implementation/implementation-manifest.md pipeline-output/02-implementation/implementation_manifest.md; fi",
    "if [ -f pipeline-output/02-implementation/implementation_manifest.md ] && [ ! -f pipeline-output/02-implementation/implementation-manifest.md ]; then cp pipeline-output/02-implementation/implementation_manifest.md pipeline-output/02-implementation/implementation-manifest.md; fi"
  ].join(' && ');

  await invoke_agent('execute', {
    command: syncCommand,
    explanation:
      'Synchronize canonical and legacy artifact file names so downstream agents can read outputs reliably.'
  });
}

// ---------------------------------------------------------------------------
// Step 1: Initialize pipeline run
// ---------------------------------------------------------------------------

export async function initialize_pipeline(
  trigger: string,
  _input: string,
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>,
  write_json: (path: string, data: unknown) => Promise<void>
): Promise<string> {
  const pipeline_run_id = `run_${new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 15)}`;

  await invoke_agent('metrics-tracker', {
    action: 'initialize',
    pipeline_run_id,
    trigger
  });

  await ensureOutputDirs(invoke_agent);
  await reconcileOutputAliases(invoke_agent);

  const state: PipelineState = {
    pipeline_run_id,
    started_at: new Date().toISOString(),
    trigger,
    current_gate: null,
    current_status: 'initializing',
    gates_completed: [],
    gates_failed: [],
    gates_warned: [],
    fix_iterations: {}
  };

  await write_json('/memories/session/pipeline-state.json', state);
  return pipeline_run_id;
}

// ---------------------------------------------------------------------------
// Step 2: Execute gates in sequence
// ---------------------------------------------------------------------------

export async function execute_pipeline(
  pipeline_run_id: string,
  gates: Gate[],
  execution_flow: Array<{ gate: string; next_on_success: string }>,
  load_state: (id: string) => PipelineState,
  save_state: (s: PipelineState) => void,
  save_checkpoint: (s: PipelineState) => void,
  execute_gate_fn: (gate: Gate, state: PipelineState) => Promise<GateResult>,
  handle_failure_fn: (
    gate: Gate,
    result: GateResult,
    state: PipelineState
  ) => Promise<GateResult>,
  finalize_fn: (
    id: string,
    state: PipelineState,
    status?: string
  ) => Promise<void>
): Promise<void> {
  const state = load_state(pipeline_run_id);

  try {
    for (const flow_step of execution_flow) {
      if (state.gates_completed.includes(flow_step.gate)) continue;

      const gate = gates.find(g => g.id === flow_step.gate);
      if (!gate) continue;

      state.current_gate = gate.id;
      save_state(state);
      save_checkpoint(state);

      const gate_result = await execute_gate_fn(gate, state);

      if (gate_result.status === 'PASSED') {
        state.gates_completed.push(gate.id);
      } else if (gate_result.status === 'WARN') {
        state.gates_warned.push(gate.id);
        if (gate.blocking) {
          const handled_result = await handle_failure_fn(gate, gate_result, state);
          if (handled_result.status === ('BLOCKED' as GateStatus)) {
            state.current_status = 'blocked';
            save_state(state);
            break;
          }
        }
      } else if (gate_result.status === 'FAILED') {
        state.gates_failed.push(gate.id);
        const handled_result = await handle_failure_fn(gate, gate_result, state);
        if (handled_result.status === ('BLOCKED' as GateStatus)) {
          state.current_status = 'blocked';
          save_state(state);
          break;
        }
      }

    }
  } finally {
    await finalize_fn(pipeline_run_id, state, state.current_status || 'success');
  }
}

// ---------------------------------------------------------------------------
// Step 3: Execute a single gate (sequential or parallel)
// ---------------------------------------------------------------------------

export async function execute_gate(
  gate: Gate,
  state: PipelineState,
  execute_agent_fn: (
    name: string,
    gate: Gate,
    state: PipelineState,
    shared_context: SharedContext
  ) => Promise<GateResult>,
  execute_parallel_fn: (
    ids: string[],
    gates: Gate[],
    state: PipelineState,
    shared_context: SharedContext
  ) => Promise<GateResult[]>,
  shared_context: SharedContext,
  gates: Gate[],
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>,
  aggregate_results: (results: GateResult[], gate: Gate) => GateResult
): Promise<GateResult> {
  await invoke_agent('metrics-tracker', {
    action: 'record_gate_start',
    pipeline_run_id: state.pipeline_run_id,
    gate_id: gate.id,
    gate_name: gate.name
  });

  if (
    gate.id === 'SDLC_PARALLEL_QUALITY_GATES' ||
    gate.id === 'SDLC_PARALLEL_AUDIT_GATES'
  ) {
    const parallel_results = await execute_parallel_fn(
      gate.parallel_gates ?? [],
      gates,
      state,
      shared_context
    );
    return aggregate_results(parallel_results, gate);
  }

  const agent_results: GateResult[] = [];
  for (const agent_name of gate.agents) {
    const result = await execute_agent_fn(
      agent_name,
      gate,
      state,
      shared_context
    );
    agent_results.push(result);
    if (result.status === 'FAILED' && gate.blocking) break;
  }

  const gate_result = aggregate_results(agent_results, gate);

  await invoke_agent('metrics-tracker', {
    action: 'record_gate_completion',
    pipeline_run_id: state.pipeline_run_id,
    gate_id: gate.id,
    gate_name: gate.name,
    status: gate_result.status
  });

  return gate_result;
}

// ---------------------------------------------------------------------------
// Step 4: Execute a single agent
// ---------------------------------------------------------------------------

export async function execute_agent(
  agent_name: string,
  gate: Gate,
  state: PipelineState,
  runSubagent: (args: {
    agentName: string;
    description: string;
    prompt: string;
    model: string;
  }) => Promise<{ text: string; entries_processed?: number }>,
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>,
  extract_token_usage: (result: { text: string }) => {
    input: number;
    output: number;
    cache_read: number;
    cache_new: number;
  },
  shared_context: SharedContext
): Promise<GateResult> {
  await invoke_agent('metrics-tracker', {
    action: 'record_agent_start',
    pipeline_run_id: state.pipeline_run_id,
    agent_name,
    gate_id: gate.id,
    phase: gate.phase,
    model: gate.model
  });

  // Extract relevant context for this agent (optimized).
  // Context is pre-extracted here so only agent-relevant fields are sent,
  // reducing input tokens per call. See context-manager.enforcer.ts for details.
  const context_extract = extractContextForAgent(shared_context, agent_name);
  const context_prompt = generateContextPrompt(context_extract);
  const output_dir = phaseToOutputDir(gate.phase);

  const result = await runSubagent({
    agentName: agent_name,
    description: `Execute ${agent_name} for ${gate.id}`,
    prompt: `
      You are ${agent_name} executing for gate ${gate.id}.
      Pipeline Run ID: ${state.pipeline_run_id}
      Feature: ${state.feature_description ?? ''}
      Change Manifest: ${
        state.change_manifest_path ?? 'pipeline-output/change-manifest.json'
      }
      
      ${context_prompt}
      
      Perform your specialized task and generate structured output as defined in your agent specification.
      Canonical output directory: ${output_dir}/
      Legacy compatibility directories also exist: pipeline-output/01-planning/, pipeline-output/04-review/, pipeline-output/05-testing/, pipeline-output/06-audits/, pipeline-output/07-reports/
    `,
    model: gate.model
  });

  const parsed_result = parseAgentResult(result.text, agent_name);

  await invoke_agent('metrics-tracker', {
    action: 'record_agent_completion',
    pipeline_run_id: state.pipeline_run_id,
    agent_name,
    tokens: extract_token_usage(result),
    status: parsed_result.status,
    errorCategory: parsed_result.errorCategory,
    attributed_entries: result.entries_processed ?? 0
  });

  return parsed_result;
}

// ---------------------------------------------------------------------------
// Step 5: Handle gate failures (error-category-aware)
// ---------------------------------------------------------------------------

export async function handle_gate_failure(
  gate: Gate,
  gate_result: GateResult,
  state: PipelineState,
  execute_gate_fn: (gate: Gate, state: PipelineState) => Promise<GateResult>,
  execute_agent_fn: (
    name: string,
    gate: Gate,
    state: PipelineState
  ) => Promise<GateResult>,
  save_state: (s: PipelineState) => void,
  finalize_fn: (
    id: string,
    state: PipelineState,
    status?: string
  ) => Promise<void>,
  sleep: (ms: number) => Promise<void>
): Promise<GateResult> {
  const strategy = getRetryStrategy(gate_result);

  // TRANSIENT — retry with exponential backoff
  if (strategy.action === 'retry_immediately') {
    const retries = state.fix_iterations[gate.id] ?? 0;
    if (retries < strategy.maxRetries) {
      state.fix_iterations[gate.id] = retries + 1;
      save_state(state);
      await sleep(strategy.backoffMs * Math.pow(2, retries));
      return execute_gate_fn(gate, state);
    }
  }

  // VALIDATION — retry after fixer agent
  if (
    strategy.action === 'retry_with_fix' &&
    (state.fix_iterations[gate.id] ?? 0) < gate.max_fix_iterations
  ) {
    const fix_result = await execute_agent_fn('sdlc-g2.75-fixer', gate, state);
    state.fix_iterations[gate.id] = (state.fix_iterations[gate.id] ?? 0) + 1;
    save_state(state);
    if (fix_result.status === 'PASSED') {
      return execute_gate_fn(gate, state);
    }
  }

  // PERMISSION — escalate immediately
  if (strategy.action === 'escalate_to_human') {
    await finalize_fn(state.pipeline_run_id, state, 'blocked');
    return {
      status: 'BLOCKED' as GateStatus,
      isError: true,
      errorCategory: 'permission',
      isRetryable: false,
      description: gate_result.description ?? `Permission denied at ${gate.id}.`
    };
  }

  // BUSINESS — block pipeline, no retry
  if (gate.blocking) {
    await finalize_fn(state.pipeline_run_id, state, 'blocked');
    return {
      status: 'BLOCKED' as GateStatus,
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      blockingIssues: gate_result.blockingIssues ?? [],
      description: `Pipeline blocked at ${gate.id}. Human intervention required.`
    };
  }

  // Non-blocking — log and continue
  return {
    status: 'WARN',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: `${gate.id} failed but is non-blocking.`
  };
}

// ---------------------------------------------------------------------------
// Step 6: Finalize pipeline run
// ---------------------------------------------------------------------------

export async function finalize_pipeline(
  pipeline_run_id: string,
  state: PipelineState,
  status: string = 'success',
  invoke_agent: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<unknown>
): Promise<void> {
  await ensureOutputDirs(invoke_agent);
  await reconcileOutputAliases(invoke_agent);

  await invoke_agent('metrics-tracker', {
    action: 'finalize',
    pipeline_run_id,
    status
  });
  await invoke_agent('sdlc-g8-dashboard-generator', { pipeline_run_id });
  await invoke_agent('sdlc-g8-meta-learner', { pipeline_run_id, state });
}

// ---------------------------------------------------------------------------
// Step 7: Parallel gate execution
// ---------------------------------------------------------------------------

export async function execute_parallel_gates(
  gate_ids: string[],
  state: PipelineState,
  gates: Gate[],
  execute_gate_fn: (
    gate: Gate,
    state: PipelineState
  ) => Promise<GateResult & { gate_id?: string }>
): Promise<GateResult> {
  const promises = gate_ids.map(id => {
    const gate = gates.find(g => g.id === id);
    return gate
      ? execute_gate_fn(gate, state)
      : Promise.resolve({
          status: 'PASSED' as GateStatus,
          isError: false,
          errorCategory: null as null,
          isRetryable: false,
          description: 'Gate not found',
          gate_id: id
        });
  });

  const results = await Promise.all(promises);
  const any_failed = results.some(
    r => r.status === 'FAILED' && gates.find(g => g.id === r.gate_id)?.blocking
  );
  const any_warned = results.some(r => r.status === 'WARN');

  if (any_failed)
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      description: 'One or more parallel gates failed.'
    };
  if (any_warned)
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: 'One or more parallel gates warned.'
    };
  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'All parallel gates passed.'
  };
}

// ---------------------------------------------------------------------------
// Step 8: User approval gate (SDLC_G1_PLAN)
// ---------------------------------------------------------------------------

export async function handle_user_approval_gate(
  gate: Gate,
  _gate_result: GateResult,
  read_file: (path: string) => Promise<string>,
  vscode_askQuestions: (
    qs: Array<{
      header: string;
      question: string;
      options: Array<{ label: string; description: string }>;
    }>
  ) => Promise<{ answers: Record<string, { selected: string[] }> }>
): Promise<GateResult> {
  let plan = '';
  try {
    plan = await read_file('pipeline-output/01-plan/feature-plan.md');
  } catch {
    plan = await read_file('pipeline-output/01-planning/development-plan.md');
  }
  console.log(plan);

  const response = await vscode_askQuestions([
    {
      header: 'Development Plan Approval',
      question:
        'Review the development plan above. Approve to proceed or request revision?',
      options: [
        {
          label: 'Approve',
          description: 'Plan looks good, continue with implementation'
        },
        { label: 'Revise', description: 'Request changes to the plan' },
        { label: 'Abort', description: 'Cancel pipeline execution' }
      ]
    }
  ]);

  const selected = response.answers['Development Plan Approval'].selected;
  if (selected.includes('Approve')) {
    return {
      status: 'PASSED',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: 'Plan approved by user.'
    };
  } else if (selected.includes('Abort')) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      description: 'Pipeline aborted by user.'
    };
  }
  return {
    status: 'WARN',
    isError: false,
    errorCategory: 'validation',
    isRetryable: true,
    description: 'Plan revision requested.'
  };
}
