# Fix Report — Iteration {{ITERATION}}

**Gate**: {{GATE_ID}}  
**Iteration**: {{ITERATION}} of {{MAX_ITERATIONS}}  
**Date**: {{DATE}}

---

## Fixes Applied

| File | Line | Issue | Fix Applied |
| ---- | ---- | ----- | ----------- |

{{#EACH_FIX}}
| {{FILE}} | {{LINE}} | {{ISSUE}} | {{FIX}} |
{{/EACH_FIX}}

## Requires Human Attention

| File | Issue | Reason not auto-fixed |
| ---- | ----- | --------------------- |

{{#EACH_UNFIXED}}
| {{FILE}} | {{ISSUE}} | {{REASON}} |
{{/EACH_UNFIXED}}

## Next Step

{{NEXT_STEP}}
