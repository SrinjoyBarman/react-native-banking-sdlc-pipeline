# Senior Review Report — Gate SDLC_G3_REVIEW

**Feature**: {{FEATURE_NAME}}  
**Date**: {{DATE}}  
**Verdict**: {{VERDICT}}

---

## Summary

{{SUMMARY}}

## Findings

### 🔴 Must Fix (blocking)

| #   | File | Issue | Recommendation |
| --- | ---- | ----- | -------------- |

{{#EACH_CRITICAL}}
| {{ID}} | {{FILE}} | {{ISSUE}} | {{RECOMMENDATION}} |
{{/EACH_CRITICAL}}

### 🟡 Should Address (non-blocking)

| #   | File | Issue | Recommendation |
| --- | ---- | ----- | -------------- |

{{#EACH_MAJOR}}
| {{ID}} | {{FILE}} | {{ISSUE}} | {{RECOMMENDATION}} |
{{/EACH_MAJOR}}

### ℹ️ Informational

| #   | File | Observation |
| --- | ---- | ----------- |

{{#EACH_INFO}}
| {{ID}} | {{FILE}} | {{OBSERVATION}} |
{{/EACH_INFO}}

## Architecture Verdict

{{ARCHITECTURE_VERDICT}}
