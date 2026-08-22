# Code Review Report — Gate SDLC_G3_REVIEW

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Reviewed**: {{FILES_REVIEWED}}  
**Total Bugs**: {{TOTAL_BUGS}} ({{CRITICAL_COUNT}} critical, {{MAJOR_COUNT}} major, {{MINOR_COUNT}} minor)

---

## Review Summary

{{REVIEW_SUMMARY}}

## Findings by File

{{#EACH_FILE}}

### {{FILE_PATH}} ({{BUG_COUNT}} bugs)

| #   | Severity | Line | Category | Description | Fix |
| --- | -------- | ---- | -------- | ----------- | --- |

{{#EACH_BUG}}
| {{BUG_ID}} | {{SEVERITY_EMOJI}} {{SEVERITY}} | {{LINE}} | {{CATEGORY}} | {{DESCRIPTION}} | {{FIX}} |
{{/EACH_BUG}}

{{/EACH_FILE}}

## Summary by Category

| Category | Count | Critical | Major | Minor |
| -------- | ----- | -------- | ----- | ----- |

{{#EACH_CATEGORY}}
| {{CATEGORY_NAME}} | {{TOTAL}} | {{CRITICAL}} | {{MAJOR}} | {{MINOR}} |
{{/EACH_CATEGORY}}

## Equal Depth Analysis Verification

- Files reviewed: {{FILES_REVIEWED}}
- Average bugs per file: {{AVG_BUGS_PER_FILE}}
- Depth variance: {{DEPTH_VARIANCE}}%
- Equal depth enforced: {{EQUAL_DEPTH_STATUS}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G3_REVIEW completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
