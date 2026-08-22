# ESLint Report — Gate SDLC_G2.1_LINT

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Checked**: {{FILES_CHECKED}}  
**Total Violations**: {{TOTAL_VIOLATIONS}} ({{ERROR_COUNT}} errors, {{WARNING_COUNT}} warnings)  
**Auto-Fixed**: {{AUTO_FIXED_COUNT}} violations

---

## Violations by File

{{#EACH_FILE}}

### {{FILE_PATH}} ({{ISSUE_COUNT}} issues)

| Line | Severity | Rule | Message |
| ---- | -------- | ---- | ------- |

{{#EACH_VIOLATION}}
| {{LINE}} | {{SEVERITY_EMOJI}} {{SEVERITY}} | {{RULE_ID}} | {{MESSAGE}} |
{{/EACH_VIOLATION}}

{{/EACH_FILE}}

## Summary by Rule

| Rule | Count | Severity |
| ---- | ----- | -------- |

{{#EACH_RULE}}
| {{RULE_NAME}} | {{COUNT}} | {{SEVERITY}} |
{{/EACH_RULE}}

## Auto-Fix Summary

{{AUTO_FIX_SUMMARY}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G2.1_LINT completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
