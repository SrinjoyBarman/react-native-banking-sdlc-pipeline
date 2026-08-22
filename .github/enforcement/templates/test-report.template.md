# Test Report — Gate SDLC_G4_TESTING

**Status**: {{STATUS_EMOJI}} {{STATUS}}  
**Executed At**: {{TIMESTAMP}}  
**Tests Run**: {{TESTS_RUN}} ({{PASSED}} passed, {{FAILED}} failed)

---

## Coverage Summary

| Metric     | Result             | Threshold                | Status               |
| ---------- | ------------------ | ------------------------ | -------------------- |
| Statements | {{STATEMENT_PCT}}% | {{STATEMENT_THRESHOLD}}% | {{STATEMENT_STATUS}} |
| Branches   | {{BRANCH_PCT}}%    | {{BRANCH_THRESHOLD}}%    | {{BRANCH_STATUS}}    |
| Functions  | {{FUNCTION_PCT}}%  | {{FUNCTION_THRESHOLD}}%  | {{FUNCTION_STATUS}}  |
| Lines      | {{LINE_PCT}}%      | {{LINE_THRESHOLD}}%      | {{LINE_STATUS}}      |

## Coverage by File

| File | Statements | Branches | Functions | Lines |
| ---- | ---------- | -------- | --------- | ----- |

{{#EACH_FILE}}
| {{FILE_PATH}} | {{STMT_PCT}}% | {{BRANCH_PCT}}% | {{FUNC_PCT}}% | {{LINE_PCT}}% |
{{/EACH_FILE}}

## Failed Tests

{{#EACH_FAILED_TEST}}

### {{TEST_NAME}}

**File**: {{TEST_FILE}}  
**Error**: {{ERROR_MESSAGE}}

{{/EACH_FAILED_TEST}}

## Gate Decision

**Result**: {{GATE_RESULT_EMOJI}} **{{GATE_RESULT}}**

{{RECOMMENDATIONS}}

---

_Gate SDLC_G4_TESTING completed at {{COMPLETION_TIMESTAMP}} ({{DURATION}} seconds)_
