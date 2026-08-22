/**
 * Gate Summary Aggregator
 *
 * Lightweight JSON summaries for efficient reporting
 * Reduces token usage from 30k+ to ~1-2k
 */

export interface GateSummary {
  gate_id: string;
  gate_name: string;
  status: 'PASSED' | 'WARN' | 'FAILED' | 'BLOCKED';
  blocking: boolean;
  duration_ms: number;
  findings: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  files_analyzed: number;
  top_issues?: Array<{
    file: string;
    severity: string;
    message: string;
  }>;
}

export interface PipelineSummary {
  run_id: string;
  mode: 'validate' | 'full' | 'resume';
  started_at: string;
  completed_at: string;
  duration_ms: number;
  status: 'success' | 'blocked' | 'failed';
  gates: GateSummary[];
  optimization: {
    shared_context_enabled: boolean;
    incremental_mode_enabled: boolean;
    files_analyzed: number;
    files_skipped: number;
    tokens_estimated: {
      total: number;
      saved: number;
      percentage: number;
    };
  };
  blocking_issues: Array<{
    gate: string;
    severity: string;
    description: string;
    files_affected: string[];
  }>;
}

/**
 * Create gate summary from gate report
 */
export function createGateSummary(
  gate_id: string,
  gate_name: string,
  status: string,
  report_data: any
): GateSummary {
  return {
    gate_id,
    gate_name,
    status: status as any,
    blocking: report_data.blocking ?? false,
    duration_ms: report_data.duration_ms ?? 0,
    findings: {
      total: report_data.total_violations ?? 0,
      critical: report_data.critical_count ?? 0,
      high: report_data.high_count ?? 0,
      medium: report_data.medium_count ?? 0,
      low: report_data.low_count ?? 0
    },
    files_analyzed: report_data.files_analyzed ?? 0,
    top_issues: report_data.top_issues?.slice(0, 3) ?? []
  };
}

/**
 * Aggregate all gate summaries into pipeline summary
 */
export async function aggregatePipelineSummary(
  run_id: string,
  mode: string,
  read_json: (path: string) => Promise<any>
): Promise<PipelineSummary> {
  const gate_summaries: GateSummary[] = [];

  const readFirstAvailableJson = async (paths: string[]): Promise<any> => {
    let lastError: unknown;
    for (const path of paths) {
      try {
        return await read_json(path);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('No readable report found');
  };

  // Read gate summary JSONs (not full markdown reports)
  const gate_paths = [
    ['pipeline-output/03-quality/lint-report.json'],
    ['pipeline-output/03-quality/typecheck-report.json'],
    ['pipeline-output/03-quality/framework-rules-report.json'],
    ['pipeline-output/03-quality/circular-deps-report.json'],
    ['pipeline-output/03-quality/import-boundary-report.json'],
    ['pipeline-output/06-testing/test-report.json', 'pipeline-output/05-testing/test-report.json'],
    ['pipeline-output/07-audits/performance-report.json', 'pipeline-output/06-audits/performance-report.json'],
    ['pipeline-output/07-audits/accessibility-report.json', 'pipeline-output/06-audits/accessibility-report.json'],
    ['pipeline-output/07-audits/dependency-report.json', 'pipeline-output/06-audits/dependency-report.json']
  ];

  for (const paths of gate_paths) {
    try {
      const report = await readFirstAvailableJson(paths);
      const summary = createGateSummary(
        report.gate_id,
        report.gate_name,
        report.status,
        report
      );
      gate_summaries.push(summary);
    } catch (err) {
      // Gate not run or file missing - skip
    }
  }

  // Calculate blocking issues
  const blocking_issues = gate_summaries
    .filter(g => g.status === 'FAILED' || g.status === 'BLOCKED')
    .map(g => ({
      gate: g.gate_id,
      severity: g.findings.critical > 0 ? 'critical' : 'high',
      description: `${g.gate_name} failed with ${g.findings.total} findings`,
      files_affected: []
    }));

  // Read optimization metrics if available
  let optimization_metrics = {
    shared_context_enabled: false,
    incremental_mode_enabled: false,
    files_analyzed: 0,
    files_skipped: 0,
    tokens_estimated: { total: 0, saved: 0, percentage: 0 }
  };

  try {
    const opt_report = await readFirstAvailableJson([
      'pipeline-output/08-reports/token-optimization-report.json',
      'pipeline-output/07-reports/token-optimization-report.json'
    ]);
    optimization_metrics = opt_report.optimization_metrics;
  } catch {
    // No optimization report - use defaults
  }

  return {
    run_id,
    mode: mode as any,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: 0, // Calculated from state
    status: blocking_issues.length > 0 ? 'blocked' : 'success',
    gates: gate_summaries,
    optimization: optimization_metrics,
    blocking_issues
  };
}

/**
 * Generate lightweight findings summary for sdlc-g8-meta-learner
 */
export interface FindingsSummary {
  recurring_patterns: Array<{
    pattern: string;
    count: number;
    files: string[];
    severity: string;
  }>;
  gate_performance: Array<{
    gate: string;
    avg_findings: number;
    pass_rate: number;
  }>;
  recommendations: string[];
}

export function generateFindingsSummary(
  pipeline_summary: PipelineSummary
): FindingsSummary {
  // Analyze patterns across gates
  const all_issues = pipeline_summary.gates.flatMap(g => g.top_issues || []);

  // Group by message pattern
  const pattern_map = new Map<
    string,
    { count: number; files: Set<string>; severity: string }
  >();

  for (const issue of all_issues) {
    const pattern = issue.message.substring(0, 50); // First 50 chars as pattern
    if (!pattern_map.has(pattern)) {
      pattern_map.set(pattern, {
        count: 0,
        files: new Set(),
        severity: issue.severity
      });
    }
    const entry = pattern_map.get(pattern)!;
    entry.count++;
    entry.files.add(issue.file);
  }

  const recurring_patterns = Array.from(pattern_map.entries())
    .filter(([_, data]) => data.count > 1)
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      files: Array.from(data.files),
      severity: data.severity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 patterns

  const gate_performance = pipeline_summary.gates.map(g => ({
    gate: g.gate_id,
    avg_findings: g.findings.total,
    pass_rate: g.status === 'PASSED' ? 1.0 : 0.0
  }));

  return {
    recurring_patterns,
    gate_performance,
    recommendations: [
      'Use structured JSON summaries for reporting (reduces tokens)',
      'Enable incremental mode for validation runs',
      'Cache npm audit results when dependencies unchanged'
    ]
  };
}
