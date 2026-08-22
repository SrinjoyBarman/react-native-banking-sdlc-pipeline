# Problem Spec: {{FEATURE_NAME}}

**Date**: {{DATE}}  
**Author**: sdlc-g0-requirements-analyst

---

## Overview

{{OVERVIEW_SUMMARY}}

## Affected Modules

{{#EACH_MODULE}}

- `{{MODULE_NAME}}` — {{REASON}}
  {{/EACH_MODULE}}

## Sub-Problems

{{#EACH_SUBPROBLEM}}
{{INDEX}}. {{DESCRIPTION}}
{{/EACH_SUBPROBLEM}}

## Constraints

{{#EACH_CONSTRAINT}}

- {{CONSTRAINT_DESCRIPTION}}
  {{/EACH_CONSTRAINT}}

## Edge Cases

{{#EACH_EDGE_CASE}}

- {{EDGE_CASE_DESCRIPTION}} → Expected: {{EXPECTED_BEHAVIOUR}}
  {{/EACH_EDGE_CASE}}

## Assumptions

{{#EACH_ASSUMPTION}}

- {{ASSUMPTION_DESCRIPTION}}
  {{/EACH_ASSUMPTION}}

## Acceptance Criteria

{{#EACH_CRITERION}}

- [ ] {{CRITERION_TEXT}}
      {{/EACH_CRITERION}}

## Dependencies

{{#EACH_DEPENDENCY}}

- {{DEPENDENCY_DESCRIPTION}}
  {{/EACH_DEPENDENCY}}
