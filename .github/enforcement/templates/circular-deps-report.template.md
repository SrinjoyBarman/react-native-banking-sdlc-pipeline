# Circular Dependencies Report — Gate SDLC_G2.4_CIRCULAR_DEPS

**Status**: {{status_emoji}} {{status}}
**Executed At**: {{executed_at}}
**Modules Checked**: {{modules_checked}}
**Modules with Cycles**: {{modules_with_cycles}}
**Total Cycles**: {{total_cycles}}

---

## Detected Cycles

{{#each cycles}}

### Cycle {{cycle_id}}: {{module}} (Depth: {{cycle_depth}})

**Severity**: {{severity_emoji}} {{severity}}

**Cycle Path**:

```
{{cycle_path_formatted}}
```

**Suggested Fix**:

1. Extract shared types to a separate `*.types.ts` file
2. Move common logic to a third file that both can import without creating a cycle
3. Verify whether the reverse import is necessary — it is often an architectural issue

---

{{/each}}

## Affected Modules

{{#each affected_modules}}

- `{{this}}`
  {{/each}}

## Gate Decision

**Result**: {{gate_result_emoji}} **{{gate_result}}**

{{#if blocking}}
Deep cycles (depth ≥ 4) are architectural violations. Fix before proceeding.
{{else}}
Non-blocking — address cycles before merge to maintain clean module boundaries.
{{/if}}

---

_Gate SDLC_G2.4_CIRCULAR_DEPS completed at {{executed_at}}_
