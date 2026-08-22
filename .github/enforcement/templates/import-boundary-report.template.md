# Import Boundary Report — Gate SDLC_G2.6_IMPORT_BOUNDARY

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Checked**: {{FILES_CHECKED}}  
**Total Violations**: {{TOTAL_VIOLATIONS}} ({{CRITICAL_COUNT}} critical, {{MAJOR_COUNT}} major)

---

## Violations by File

{{#EACH_FILE}}

### {{FILE_PATH}} ({{VIOLATION_COUNT}} violations)

| Line | Severity | Type | Message |
| ---- | -------- | ---- | ------- |

{{#EACH_VIOLATION}}
| {{LINE}} | {{SEVERITY_EMOJI}} {{SEVERITY}} | {{TYPE}} | {{MESSAGE}} |
{{/EACH_VIOLATION}}

**Details:**

{{#EACH_DETAILED_VIOLATION}}
**Line {{LINE}}**: {{TYPE}}

❌ Current:
{{CURRENT_CODE}}

✅ Suggested:
{{SUGGESTED_CODE}}

**Why this matters**: {{EXPLANATION}}

{{/EACH_DETAILED_VIOLATION}}

---

{{/EACH_FILE}}

## Violations by Type

| Type | Count | Severity | Description |
| ---- | ----- | -------- | ----------- |

{{#EACH_TYPE}}
| {{TYPE_NAME}} | {{COUNT}} | {{SEVERITY}} | {{DESCRIPTION}} |
{{/EACH_TYPE}}

## Violations by Module

| Module | Violations | Status |
| ------ | ---------- | ------ |

{{#EACH_MODULE}}
| {{MODULE_NAME}} | {{COUNT}} | {{STATUS}} |
{{/EACH_MODULE}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G2.6_IMPORT_BOUNDARY completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
