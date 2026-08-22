# TypeScript Check Report — Gate SDLC_G2.2_TYPECHECK

**Status**: {{status_emoji}} {{status}}
**Executed At**: {{executed_at}}
**Total Errors**: {{total_errors}}
**Total Warnings**: {{total_warnings}}
**Exit Code**: {{exit_code}}

---

## Errors by File

| File | Errors |
| ---- | ------ |

{{#each errors_by_file}}
| `{{@key}}` | {{this}} |
{{/each}}

## Errors by Code

| Code | Count | Description |
| ---- | ----- | ----------- |

{{#each errors_by_code}}
| `{{@key}}` | {{this}} | |
{{/each}}

## Detailed Errors

{{#each errors}}

### {{file}}:{{line}} — {{code}}

**Line**: {{line}}, **Column**: {{column}}
**Message**: {{message}}

{{/each}}

## Gate Decision

**Result**: {{gate_result_emoji}} **{{gate_result}}**

{{#if blocking}}
**Pipeline blocked.** All TypeScript errors must be resolved before proceeding.

Fix the errors listed above, then re-run:

```
@sdlc-pipeline-orchestrator resume
```

{{else}}
No blocking issues.
{{/if}}

---

_Gate SDLC_G2.2_TYPECHECK completed at {{executed_at}}_
