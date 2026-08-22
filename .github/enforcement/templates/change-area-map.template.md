# Change Area Map

**Date**: {{DATE}}  
**Detection ID**: {{DETECTION_ID}}

---

## Summary

- **Total files changed**: {{TOTAL_FILES}}
- **Affected modules**: {{MODULE_LIST}}
- **Cross-module impact**: {{CROSS_MODULE_IMPACT}}

## File → Module → Layer Mapping

| File | Module | Layer | Change Type |
| ---- | ------ | ----- | ----------- |

{{#EACH_FILE}}
| {{FILE_PATH}} | {{MODULE}} | {{LAYER}} | {{CHANGE_TYPE}} |
{{/EACH_FILE}}

## Cross-Module Impact

{{CROSS_MODULE_DESCRIPTION}}

Affected: {{AFFECTED_MODULES_LIST}}

## Missing Test Coverage

Source files without corresponding test files:

{{#EACH_MISSING_TEST}}

- {{SOURCE_FILE}} → missing: {{EXPECTED_TEST_PATH}}
  {{/EACH_MISSING_TEST}}
