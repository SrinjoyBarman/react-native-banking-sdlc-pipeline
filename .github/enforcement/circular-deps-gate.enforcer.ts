import { GateResult, CircularCycle } from './types';

// ---------------------------------------------------------------------------
// Madge output parser
// ---------------------------------------------------------------------------

/**
 * Pattern matches numbered cycle lines from madge output:
 * `1) src/a.ts > src/b.ts > src/a.ts`
 */
const MADGE_CYCLE_LINE = /^\d+\)\s+(.+)$/;

/**
 * Parses raw madge stdout into structured CircularCycle objects.
 * Each cycle line is split on ' > ' to extract the file chain.
 */
export function parseMadgeOutput(raw: string): CircularCycle[] {
  const cycles: CircularCycle[] = [];
  let cycleIndex = 0;

  for (const line of raw.split('\n')) {
    const match = MADGE_CYCLE_LINE.exec(line.trim());
    if (!match) continue;

    cycleIndex++;
    const chain = match[1].split(' > ').map(s => s.trim());
    const module = chain[0].split('/')[1] ?? 'unknown';

    cycles.push({
      module,
      depth: chain.length,
      chain
    });
  }

  return cycles;
}

// ---------------------------------------------------------------------------
// Cycles with depth >= this threshold are architectural violations (blocking).
// ---------------------------------------------------------------------------

const DEEP_CYCLE_DEPTH_THRESHOLD = 4;

/**
 * Deterministic gate enforcement for SDLC_G2.4_CIRCULAR_DEPS.
 * Deep cycles (depth ≥ 4 files) are treated as business errors and block the pipeline.
 * Shallow cycles produce a warning.
 */
export function enforceCircularDepsGate(cycles: CircularCycle[]): GateResult {
  if (cycles.length === 0) {
    return {
      status: 'PASSED',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: 'No circular dependencies found.'
    };
  }

  const criticalCycles = cycles.filter(
    c => c.depth >= DEEP_CYCLE_DEPTH_THRESHOLD
  );

  if (criticalCycles.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      blockingIssues: criticalCycles.map(
        c => `${c.module}: depth-${c.depth} cycle — ${c.chain.join(' → ')}`
      ),
      description:
        `Circular deps: ${criticalCycles.length} deep cycle(s) ` +
        `(depth ≥${DEEP_CYCLE_DEPTH_THRESHOLD}) are architectural violations.`
    };
  }

  return {
    status: 'WARN',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: `Circular deps: ${cycles.length} shallow cycle(s) found (non-blocking).`
  };
}
