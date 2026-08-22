# FinVault Pipeline Dashboard

**Feature**: {{feature_description}}
**Run ID**: {{pipeline_run_id}}
**Date**: {{date}}
**Total Duration**: {{total_duration}}
**Total Cost**: ~${{total_cost}}
**Overall Status**: {{overall_status_emoji}} **{{overall_status}}**

> **Data sources:** Feature spec → `problem-spec.md` · Gate results → `pipeline-summary.json` · Security → `security-audit-report.json` · Tokens → `metrics.json` · Coverage → `test-report.json`

---

## Requirements Summary

<!-- Source: pipeline-output/00-requirements/problem-spec.md — DO NOT infer these values -->

| Field                       | Value                                                         |
| --------------------------- | ------------------------------------------------------------- |
| **Scope**                   | {{scope_description}}                                         |
| **Key domain constants**    | {{domain_constants}}                                          |
| **Acceptance criteria met** | {{acceptance_criteria_count}} / {{acceptance_criteria_total}} |
| **Impacted modules**        | {{impacted_modules}}                                          |

---

## Gate Summary

| Gate                 | Status         | Duration         | Key Findings     |
| -------------------- | -------------- | ---------------- | ---------------- |
| G0 Entry             | {{g0_status}}  | {{g0_duration}}  | {{g0_findings}}  |
| G1 Plan              | {{g1_status}}  | {{g1_duration}}  | {{g1_findings}}  |
| G2 Implementation    | {{g2_status}}  | {{g2_duration}}  | {{g2_findings}}  |
| G2.1 Lint            | {{g21_status}} | {{g21_duration}} | {{g21_findings}} |
| G2.2 TypeCheck       | {{g22_status}} | {{g22_duration}} | {{g22_findings}} |
| G2.3 Framework Rules | {{g23_status}} | {{g23_duration}} | {{g23_findings}} |
| G2.4 Circular Deps   | {{g24_status}} | {{g24_duration}} | {{g24_findings}} |
| G2.5 Security        | {{g25_status}} | {{g25_duration}} | {{g25_findings}} |
| G2.6 Import Boundary | {{g26_status}} | {{g26_duration}} | {{g26_findings}} |
| G3 Review            | {{g3_status}}  | {{g3_duration}}  | {{g3_findings}}  |
| G4 Testing           | {{g4_status}}  | {{g4_duration}}  | {{g4_findings}}  |
| G5 Performance       | {{g5_status}}  | {{g5_duration}}  | {{g5_findings}}  |
| G6 Accessibility     | {{g6_status}}  | {{g6_duration}}  | {{g6_findings}}  |
| G7 Dependencies      | {{g7_status}}  | {{g7_duration}}  | {{g7_findings}}  |

## Findings Summary

| Severity    | Count              | Fixed              | Remaining              |
| ----------- | ------------------ | ------------------ | ---------------------- |
| 🔴 Critical | {{critical_total}} | {{critical_fixed}} | {{critical_remaining}} |
| 🟠 High     | {{high_total}}     | {{high_fixed}}     | {{high_remaining}}     |
| 🟡 Medium   | {{medium_total}}   | {{medium_fixed}}   | {{medium_remaining}}   |
| ℹ️ Low      | {{low_total}}      | {{low_fixed}}      | {{low_remaining}}      |

## Token & Cost Breakdown

<!-- Source: /memories/session/metrics.json — if missing, write "N/A — metrics not recorded" -->

| Agent | Tokens (in/out) | Cost |
| ----- | --------------- | ---- |

{{#each agent_metrics}}
| {{agent_name}} | {{tokens_in}}k / {{tokens_out}}k | ${{cost}} |
{{/each}}
| **Total**           | **{{total_tokens_in}}k / {{total_tokens_out}}k** | **${{total_cost}}\*\* |

**Budget:** {{budget_tokens}} tokens · **Utilisation:** {{budget_utilisation}}%

## Model Routing

<!-- Source: pipeline-summary.json agent_metrics[].model — DO NOT assume tiers -->

| Phase | Agent | Model/Tier |
| ----- | ----- | ---------- |

{{#each agent_metrics}}
| {{phase}} | {{agent_name}} | {{model}} |
{{/each}}

## Security Findings

<!-- Source: pipeline-output/04-review/security-audit-report.json findings[] — NEVER use a static checklist -->

| Threat | Severity | Mitigation | Status |
| ------ | -------- | ---------- | ------ |

{{#each security_findings}}
| {{threat}} | {{severity}} | {{mitigation}} | {{status}} |
{{/each}}

## Test Coverage

<!-- Source: pipeline-output/05-testing/test-report.json — values must match exactly -->

| Module | Statements | Branches | Functions | Lines |
| ------ | ---------- | -------- | --------- | ----- |

{{#each coverage}}
| {{module}} | {{statements}}% | {{branches}}% | {{functions}}% | {{lines}}% |
{{/each}}

---

_Generated at {{generated_at}} by sdlc-g8-dashboard-generator_
