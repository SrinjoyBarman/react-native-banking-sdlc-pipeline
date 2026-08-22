# Security Audit Report — Gate SDLC_G2.5_SECURITY

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Files Audited**: {{FILES_AUDITED}}  
**Total Findings**: {{TOTAL_FINDINGS}} ({{CRITICAL_COUNT}} critical, {{HIGH_COUNT}} high, {{MEDIUM_COUNT}} medium, {{LOW_COUNT}} low)

---

## Executive Summary

{{EXECUTIVE_SUMMARY}}

## Critical Findings

{{#EACH_CRITICAL}}

### {{FINDING_ID}}: {{TITLE}}

**File**: {{FILE_PATH}}  
**Line**: {{LINE}}  
**CWE**: {{CWE_ID}}  
**OWASP**: {{OWASP_CATEGORY}}

**Description**: {{DESCRIPTION}}

**Code Snippet**:
{{CODE_SNIPPET}}

**Impact**: {{IMPACT}}

**Exploit Scenario**: {{EXPLOIT_SCENARIO}}

**Fix**:
{{FIX_RECOMMENDATION}}

**References**:
{{#EACH_REFERENCE}}

- {{REFERENCE_URL}}
  {{/EACH_REFERENCE}}

---

{{/EACH_CRITICAL}}

## High Findings

{{#EACH_HIGH}}

### {{FINDING_ID}}: {{TITLE}}

{{SUMMARY}}

{{/EACH_HIGH}}

## Summary by OWASP Category

| Category | Findings | Critical | High | Medium | Low |
| -------- | -------- | -------- | ---- | ------ | --- |

{{#EACH_OWASP}}
| {{CATEGORY_NAME}} | {{TOTAL}} | {{CRITICAL}} | {{HIGH}} | {{MEDIUM}} | {{LOW}} |
{{/EACH_OWASP}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{BLOCKING_ISSUES}}

{{RECOMMENDATIONS}}

---

_Gate SDLC_G2.5_SECURITY completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
