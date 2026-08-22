## Review: {{REVIEW_SCOPE}}

### Violations Found

| #   | Severity | File | Line(s) | Rule Violated | Description |
| --- | -------- | ---- | ------- | ------------- | ----------- |

{{#EACH_VIOLATION}}
| {{ID}} | {{SEVERITY}} | {{FILE}} | {{LINES}} | {{RULE}} | {{DESCRIPTION}} |
{{/EACH_VIOLATION}}

### Warnings

{{#EACH_WARNING}}

- {{WARNING_DESCRIPTION}}
  {{/EACH_WARNING}}

### Passes

{{#EACH_PASS}}

- {{STANDARD_CHECKED}}
  {{/EACH_PASS}}

### Summary

- Total violations: {{TOTAL_VIOLATIONS}}
- Critical: {{CRITICAL_COUNT}} | Major: {{MAJOR_COUNT}} | Minor: {{MINOR_COUNT}}
- Recommendation: {{RECOMMENDATION}}
- Tokens used: {{TOKEN_COUNT}} _(pipeline runs only — populated by @metrics-tracker)_
