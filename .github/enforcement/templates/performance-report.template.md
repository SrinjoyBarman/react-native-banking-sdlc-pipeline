# Performance Report — Gate SDLC_G5_PERFORMANCE

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Audited**: {{FILES_AUDITED}}

---

## Bundle Size Impact

| Metric       | Before          | After          | Change          | Status     |
| ------------ | --------------- | -------------- | --------------- | ---------- |
| Total Bundle | {{BEFORE_SIZE}} | {{AFTER_SIZE}} | {{CHANGE_PCT}}% | {{STATUS}} |

## Render Performance

{{#EACH_COMPONENT}}

### {{COMPONENT_NAME}}

- **Re-renders**: {{RENDER_COUNT}}
- **Inline objects/functions**: {{INLINE_COUNT}}
- **Status**: {{STATUS}}

{{/EACH_COMPONENT}}

## Memory Leaks

{{#EACH_LEAK}}

- **{{FILE}}:{{LINE}}** — {{LEAK_TYPE}}: {{DESCRIPTION}}
  {{/EACH_LEAK}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G5_PERFORMANCE completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
