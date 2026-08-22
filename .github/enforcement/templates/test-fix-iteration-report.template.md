# Test Fix Iteration Report — Iteration {{ITERATION}}/{{MAX_ITERATIONS}}

**Gate**: SDLC_G4_TESTING  
**Date**: {{DATE}}

---

## Analysis

- Total failures: {{FAILURE_COUNT}}
- Root causes: {{CATEGORIZED_ISSUES}}

## Fixes Applied

- [P0] {{JEST_CONFIG_FIXES}}
- [P1] {{PROVIDER_FIXES}}
- [P2] {{MOCK_FIXES}}
- [P3] {{ASYNC_FIXES}}
- [P4] {{COVERAGE_FIXES}}

## Validation

```bash
npm test -- --coverage --bail
```

**Results:**

- Failures: {{FAILURES_BEFORE}} → {{FAILURES_AFTER}}
- Coverage: {{COVERAGE_BEFORE}}% → {{COVERAGE_AFTER}}%

## Next Steps

{{#IF_PASSING}}
✅ All tests passing, coverage above threshold. Auto-continuing to G5–G7 gates.
{{/IF_PASSING}}
{{#IF_NOT_PASSING}}
Proceeding to iteration {{NEXT_ITERATION}}.
{{/IF_NOT_PASSING}}

---

**Tokens:** ~{{TOKENS}}k
