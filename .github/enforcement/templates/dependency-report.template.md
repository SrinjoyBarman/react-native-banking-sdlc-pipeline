# Dependency Audit Report — Gate SDLC_G7_DEPENDENCIES

**Date**: {{DATE}}  
**Status**: {{STATUS_EMOJI}} {{STATUS}}

---

## Summary

| Severity | Count              | Production        | Status              |
| -------- | ------------------ | ----------------- | ------------------- |
| Critical | {{CRITICAL_COUNT}} | {{CRITICAL_PROD}} | {{CRITICAL_STATUS}} |
| High     | {{HIGH_COUNT}}     | {{HIGH_PROD}}     | {{HIGH_STATUS}}     |
| Moderate | {{MODERATE_COUNT}} | {{MODERATE_PROD}} | {{MODERATE_STATUS}} |
| Low      | {{LOW_COUNT}}      | {{LOW_PROD}}      | {{LOW_STATUS}}      |

## Critical / High Findings

{{#EACH_FINDING}}

### {{PACKAGE_NAME}} ({{SEVERITY}} — {{SCOPE}})

- **Affected versions**: {{AFFECTED_VERSIONS}}
- **Fixed in**: {{FIXED_VERSION}}
- **Fix available**: {{FIX_AVAILABLE}}
- **CVE**: {{CVE_ID}}
- **Description**: {{DESCRIPTION}}

{{/EACH_FINDING}}

## Recommended Actions

{{RECOMMENDATIONS}}

---

_Gate SDLC_G7_DEPENDENCIES completed at {{COMPLETION_TIMESTAMP}}_
