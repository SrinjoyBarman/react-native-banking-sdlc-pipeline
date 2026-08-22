# Test Strategy: {{FEATURE_NAME}}

**Date**: {{DATE}}  
**Author**: sdlc-g4-test-planner

---

## Coverage Targets

- Statements: ≥ {{STATEMENT_THRESHOLD}}%
- Branches: ≥ {{BRANCH_THRESHOLD}}%
- Functions: ≥ {{FUNCTION_THRESHOLD}}%
- Lines: ≥ {{LINE_THRESHOLD}}%

## Test Cases

{{#EACH_TEST_CASE}}

### TC-{{TEST_ID}}: {{TEST_TITLE}}

- **Type**: {{TEST_TYPE}}
- **File**: `{{TEST_FILE_PATH}}`
- **Criterion**: {{ACCEPTANCE_CRITERION}}
- **Mocks**: {{MOCK_LIST}}
- **Scenario**: {{SCENARIO_DESCRIPTION}}

{{/EACH_TEST_CASE}}

## Mock Requirements

| Module | Mock strategy |
| ------ | ------------- |

{{#EACH_MOCK}}
| `{{MODULE_NAME}}` | {{MOCK_STRATEGY}} |
{{/EACH_MOCK}}
