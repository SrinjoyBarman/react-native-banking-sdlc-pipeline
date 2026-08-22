# Framework Rules Report — Gate SDLC_G2.3_FRAMEWORK_RULES

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Checked**: {{FILES_CHECKED}}  
**Total Violations**: {{TOTAL_VIOLATIONS}}

---

## Violations by Category

{{#EACH_CATEGORY}}

### {{CATEGORY_NAME}}

| File | Line | Severity | Rule | Description |
| ---- | ---- | -------- | ---- | ----------- |

{{#EACH_VIOLATION}}
| {{FILE}} | {{LINE}} | {{SEVERITY_EMOJI}} {{SEVERITY}} | {{RULE}} | {{DESCRIPTION}} |
{{/EACH_VIOLATION}}

{{/EACH_CATEGORY}}

## Summary by Rule

| Rule | Count | Severity |
| ---- | ----- | -------- |

{{#EACH_RULE}}
| {{RULE_NAME}} | {{COUNT}} | {{SEVERITY}} |
{{/EACH_RULE}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G2.3_FRAMEWORK_RULES completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
