# Accessibility Report — Gate SDLC_G6_ACCESSIBILITY

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Audited**: {{FILES_AUDITED}}  
**Total Issues**: {{TOTAL_ISSUES}}

---

## Issues by Category

### Missing testID

{{#EACH_MISSING_TESTID}}

- **{{FILE}}:{{LINE}}** — {{ELEMENT_TYPE}} lacks testID
  {{/EACH_MISSING_TESTID}}

### Missing VoiceOver Labels

{{#EACH_MISSING_LABEL}}

- **{{FILE}}:{{LINE}}** — {{ELEMENT_TYPE}} lacks accessibilityLabel
  {{/EACH_MISSING_LABEL}}

### Touch Target Issues

{{#EACH_TOUCH_TARGET}}

- **{{FILE}}:{{LINE}}** — {{ELEMENT_TYPE}} has insufficient touch target ({{SIZE}})
  {{/EACH_TOUCH_TARGET}}

## Summary

| Category | Count |
| -------- | ----- |

{{#EACH_SUMMARY}}
| {{CATEGORY}} | {{COUNT}} |
{{/EACH_SUMMARY}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G6_ACCESSIBILITY completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
