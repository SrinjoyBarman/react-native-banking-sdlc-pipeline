# {{TICKET_ID}}: {{FEATURE_TITLE}}

> **Jira:** [{{TICKET_ID}}](https://your-org.atlassian.net/browse/{{TICKET_ID}})
> **Epic / Parent:** {{PARENT_TICKET}} <!-- Set to N/A if no parent -->
> **Latest Run:** {{RUN_NUMBER}} · {{COMPLETED_AT}}
> **Overall Status:** {{OVERALL_STATUS}} <!-- ✅ PASSED | ⚠️ PARTIAL | ⚠️ INCOMPLETE | ❌ FAILED | 🚫 REVERTED -->

---

## Executive Summary

| Field | Value |
|---|---|
| Feature | {{FEATURE_TITLE}} |
| Total Runs | {{TOTAL_RUNS}} |
| Latest Run | {{RUN_NUMBER}} |
| Latest Status | {{OVERALL_STATUS}} |
| Started | {{STARTED_AT}} |
| Completed | {{COMPLETED_AT}} |
| Modules Affected | {{MODULES_AFFECTED}} |

---

## Gate Status (Latest Run: {{RUN_NUMBER}})

<!-- This table is ALWAYS replaced on each run — it reflects the current run's results only. -->

| Gate | ID | Status | Key Finding |
|---|---|---|---|
| Requirements Analysis | SDLC_G0 | {{G0_STATUS}} | {{G0_FINDING}} |
| Design Spec Extraction | SDLC_G0.5 | {{G0_5_STATUS}} | {{G0_5_FINDING}} |
| Architecture Drift | SDLC_G0.7 | {{G0_7_STATUS}} | {{G0_7_FINDING}} |
| Feature Planning | SDLC_G1 | {{G1_STATUS}} | {{G1_FINDING}} |
| Architecture Diagrams | SDLC_G1.5 | {{G1_5_STATUS}} | {{G1_5_FINDING}} |
| Implementation | SDLC_G2 | {{G2_STATUS}} | {{G2_FINDING}} |
| Lint | SDLC_G2.1 | {{G2_1_STATUS}} | {{G2_1_FINDING}} |
| TypeScript | SDLC_G2.2 | {{G2_2_STATUS}} | {{G2_2_FINDING}} |
| Framework Rules | SDLC_G2.3 | {{G2_3_STATUS}} | {{G2_3_FINDING}} |
| Circular Deps | SDLC_G2.4 | {{G2_4_STATUS}} | {{G2_4_FINDING}} |
| Security Audit | SDLC_G2.5 | {{G2_5_STATUS}} | {{G2_5_FINDING}} |
| Import Boundary | SDLC_G2.6 | {{G2_6_STATUS}} | {{G2_6_FINDING}} |
| API Contract | SDLC_G2.7 | {{G2_7_STATUS}} | {{G2_7_FINDING}} |
| Observability | SDLC_G2.8 | {{G2_8_STATUS}} | {{G2_8_FINDING}} |
| Code Review | SDLC_G3 | {{G3_STATUS}} | {{G3_FINDING}} |
| Testing | SDLC_G4 | {{G4_STATUS}} | {{G4_FINDING}} |
| Contract Tests | SDLC_G4.5 | {{G4_5_STATUS}} | {{G4_5_FINDING}} |
| Performance | SDLC_G5 | {{G5_STATUS}} | {{G5_FINDING}} |
| Accessibility | SDLC_G6 | {{G6_STATUS}} | {{G6_FINDING}} |
| Dependency Audit | SDLC_G7 | {{G7_STATUS}} | {{G7_FINDING}} |
| Pipeline Report | SDLC_G8 | {{G8_STATUS}} | {{G8_FINDING}} |

---

## What Was Built

<!-- ⚠️ APPEND ONLY — add a new ### run-NNN subsection for each run. Never delete prior subsections. -->

### {{RUN_NUMBER}} · {{RUN_DATE}}

<!-- Bullets for items built in this run. One bullet per file group or feature area. -->
- {{BUILT_ITEM_1}}

---

## Traceability

<!-- Update rows for existing REQ-IDs. Append new rows for new REQ-IDs. Never delete rows. -->

| Requirement ID | User Story | Files Changed | Coverage |
|---|---|---|---|
| {{REQ_ID}} | {{USER_STORY}} | {{FILES}} | {{COVERAGE}} |

---

## Run History

<!-- ⚠️ APPEND ONLY — add one row per run at the bottom. Never remove prior rows. -->

| Run | Type | Date | Duration | Status | Notes |
|---|---|---|---|---|---|
| {{RUN_NUMBER}} | {{RUN_TYPE}} | {{RUN_DATE}} | {{DURATION}} | {{OVERALL_STATUS}} | {{RUN_NOTES}} |

---

## Last Validate Run

<!-- This section is written/replaced by validate-only runs. Full pipeline runs do not touch it. -->
<!-- Remove this section if no validate run has been performed yet. -->

| Gate | Status | Key Finding |
|---|---|---|
| Lint (G2.1) | — | — |
| TypeScript (G2.2) | — | — |
| Framework Rules (G2.3) | — | — |
| Circular Deps (G2.4) | — | — |
| Security (G2.5) | — | — |
| Import Boundary (G2.6) | — | — |
| API Contract (G2.7) | — | — |
| Observability (G2.8) | — | — |
| Test Execution (G4) | — | — |
