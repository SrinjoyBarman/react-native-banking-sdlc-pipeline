# Pipeline Checkpoint

**Run ID**: {{pipeline_run_id}}
**Started**: {{started_at}}
**Current Gate**: {{current_gate}}
**Status**: {{current_status}}

## Completed Gates

{{#each gates_completed}}

- ✅ {{this}}
  {{/each}}

## Failed / Warned Gates

{{#each gates_failed}}

- ❌ {{this}}
  {{/each}}
  {{#each gates_warned}}
- ⚠️ {{this}}
  {{/each}}

## Next Action

{{next_action_description}}

## Resume Command

```
@sdlc-pipeline-orchestrator resume
```
