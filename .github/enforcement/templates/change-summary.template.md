# Change Detection Summary

**Detection ID**: {{detection_id}}
**Detected At**: {{detected_at}}
**Trigger**: {{trigger}}

## User Intent

- **Primary Goal**: {{user_responses.primary_goal}}
- **Feature Module**: {{user_responses.feature_module}}
- **Description**: {{user_responses.change_description}}

## Changed Files ({{total_files_changed}} total)

### High Priority ({{summary.high_priority_files}} files)

{{#each files_high_priority}}

- `{{path}}` ({{change_type}}, +{{lines_added}}/-{{lines_deleted}} lines)
  {{/each}}

### Medium Priority ({{summary.medium_priority_files}} files)

{{#each files_medium_priority}}

- `{{path}}` ({{change_type}}, +{{lines_added}}/-{{lines_deleted}} lines)
  {{/each}}

### Low Priority ({{summary.low_priority_files}} files)

{{#each files_low_priority}}

- `{{path}}` ({{change_type}}, +{{lines_added}}/-{{lines_deleted}} lines)
  {{/each}}

## Affected Areas

{{#each summary.affected_mfes}}

- **{{this}}**: {{../mfe_file_counts.[this]}} files
  {{/each}}

## Pipeline Recommendations

{{#if pipeline_recommendations.run_full_pipeline}}
✅ **Run full pipeline** (estimated {{pipeline_recommendations.estimated_duration_minutes}} minutes, ~{{pipeline_recommendations.estimated_tokens}} tokens, ~${{pipeline_recommendations.estimated_cost}})
{{else}}
⚡ **Validation only** — no new implementation required
{{/if}}

**Focus Areas:**
{{#each pipeline_recommendations.focus_areas}}

- {{this}}
  {{/each}}

---

_Ready to proceed? Invoke pipeline orchestrator with detection ID: `{{detection_id}}`_
