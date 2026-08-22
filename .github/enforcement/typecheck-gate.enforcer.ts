import { GateResult, TypeScriptError } from './types';

// ---------------------------------------------------------------------------
// TypeScript output parser
// ---------------------------------------------------------------------------

/** Pattern: `path/file.ts(line,col): error TS1234: message` */
const TS_ERROR_PATTERN =
  /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;

/**
 * Parses raw `tsc --noEmit` stdout into structured TypeScriptError objects.
 * Also extracts the exit code meaning:
 *   0 → no errors
 *   2 → type errors found
 *   other → compiler crash / config error (transient)
 */
export function parseTypescriptOutput(
  raw: string,
  exitCode: number
): {
  errors: TypeScriptError[];
  warnings: TypeScriptError[];
  exitCode: number;
} {
  const errors: TypeScriptError[] = [];
  const warnings: TypeScriptError[] = [];

  for (const line of raw.split('\n')) {
    const match = TS_ERROR_PATTERN.exec(line.trim());
    if (!match) continue;
    const [, file, lineStr, colStr, severity, code, message] = match;
    const entry: TypeScriptError = {
      file,
      line: parseInt(lineStr, 10),
      col: parseInt(colStr, 10),
      code,
      message
    };
    if (severity === 'error') {
      errors.push(entry);
    } else {
      warnings.push(entry);
    }
  }

  return { errors, warnings, exitCode };
}

/**
 * Deterministic gate enforcement for SDLC_G2.2_TYPECHECK.
 *
 * Exit code semantics (tsc):
 *   0  — success, no errors
 *   2  — compilation error (type violations in source code)
 *   1  — fatal error (config/parse failure) — treated as transient
 */
export function enforceTypecheckGate(
  exitCode: number,
  errors: TypeScriptError[]
): GateResult {
  if (exitCode === 0 && errors.length === 0) {
    return {
      status: 'PASSED',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: 'TypeScript check passed. No type errors.'
    };
  }

  if (exitCode === 2 && errors.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business', // Type violations in code — human must fix
      isRetryable: false,
      blockingIssues: errors.map(
        e => `${e.file}(${e.line},${e.col}): ${e.message} [${e.code}]`
      ),
      description: `TypeScript: ${errors.length} type error(s) must be resolved before pipeline can proceed.`
    };
  }

  // Exit code 1 or unexpected — config/tooling issue, may resolve on retry
  return {
    status: 'ERROR',
    isError: true,
    errorCategory: 'transient',
    isRetryable: true,
    description: `TypeScript compiler failed with exit code ${exitCode} (config or tooling issue). Retrying.`
  };
}
