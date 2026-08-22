# Meta-Learning Report

**Run**: {{RUN_ID}}  
**Date**: {{DATE}}

---

## Patterns Identified

### Recurring Violations (appeared in 2+ files)

| Violation | Count | Action Taken |
| --------- | ----- | ------------ |

{{#EACH_PATTERN}}
| {{VIOLATION_TYPE}} | {{COUNT}} | {{ACTION}} |
{{/EACH_PATTERN}}

### New Rules Codified

| Rule | Added To |
| ---- | -------- |

{{#EACH_RULE}}
| {{RULE_DESCRIPTION}} | {{FILE_PATH}} |
{{/EACH_RULE}}

### Gate Performance

| Gate | Avg Duration | Recurring Failures |
| ---- | ------------ | ------------------ |

{{#EACH_GATE}}
| {{GATE_ID}} | {{AVG_DURATION}} | {{FAILURE_PATTERN}} |
{{/EACH_GATE}}

## Changes Applied

{{#EACH_CHANGE}}

- {{FILE_PATH}}: {{CHANGE_DESCRIPTION}}
  {{/EACH_CHANGE}}
