# Feature Plan: {{FEATURE_NAME}}

**Date**: {{DATE}}  
**Author**: sdlc-g1-feature-planner

---

## Summary

{{IMPLEMENTATION_SUMMARY}}

## User Stories (dependency order)

{{#EACH_STORY}}

### US-{{STORY_ID}}: {{STORY_TITLE}}

**Module**: `{{MODULE_NAME}}`  
**Layer**: {{LAYER}}  
**Files**:

{{#EACH_FILE}}

- `{{FILE_PATH}}` ({{ACTION}})
  {{/EACH_FILE}}

**Depends on**: {{DEPENDENCIES}}  
**Complexity**: {{COMPLEXITY}}  
**Criteria**: {{ACCEPTANCE_CRITERION}}

{{/EACH_STORY}}

## Implementation Order

{{#EACH_PHASE}}
{{PHASE_NUMBER}}. {{STORY_LIST}} {{PARALLELISM_NOTE}}
{{/EACH_PHASE}}

## Risks & Mitigations

{{#EACH_RISK}}

- **Risk**: {{RISK_DESCRIPTION}} → **Mitigation**: {{MITIGATION_STRATEGY}}
  {{/EACH_RISK}}
