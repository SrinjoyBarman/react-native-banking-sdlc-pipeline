import { GateResult, ImportViolation } from './types';

/**
 * Deterministic gate enforcement for SDLC_G2.6_IMPORT_BOUNDARY.
 * Invalid dependency direction (e.g., auth importing from payments) blocks pipeline.
 * Deep imports (bypassing the module's public index.ts) produce a warning.
 */
export function enforceImportBoundaryGate(
  violations: ImportViolation[]
): GateResult {
  const invalidDirections = violations.filter(
    v => v.type === 'invalid_direction'
  );
  const deepImports = violations.filter(v => v.type === 'deep_import');

  if (invalidDirections.length > 0) {
    return {
      status: 'FAILED',
      isError: true,
      errorCategory: 'business',
      isRetryable: false,
      blockingIssues: invalidDirections.map(
        d => `${d.importer} → ${d.imported} [INVALID: ${d.reason}]`
      ),
      description:
        `Import boundaries: ${invalidDirections.length} invalid dependency direction(s) ` +
        `violate architecture rules.`
    };
  }

  if (deepImports.length > 0) {
    return {
      status: 'WARN',
      isError: false,
      errorCategory: null,
      isRetryable: false,
      description: `Import boundaries: ${deepImports.length} deep import(s) found (non-blocking).`
    };
  }

  return {
    status: 'PASSED',
    isError: false,
    errorCategory: null,
    isRetryable: false,
    description: 'Import boundaries clean. No violations.'
  };
}
