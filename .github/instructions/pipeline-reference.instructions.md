---
description: >
  Use when: deciding which agent to invoke, understanding pipeline gates, or
  coordinating multi-agent workflows. Quick reference for the agentic SDLC pipeline
  structure and agent responsibilities. For the full user guide, see
  .github/documentation/sdlc-pipeline-guide.md
applyTo: ".github/agents/**/*.md"
---

# Agentic SDLC Pipeline — Quick Reference

## Pipeline Invocation

**Full Pipeline:** `@sdlc-pipeline-orchestrator <feature description>`  
**Validation Only:** `@sdlc-pipeline-orchestrator validate`  
**Resume from Checkpoint:** `@sdlc-pipeline-orchestrator resume`

## Gate Execution Rules (MANDATORY)

**CRITICAL:** Optimization does NOT mean skipping gates.

### Token Optimization vs Gate Skipping

| Strategy             | What It Means                          | What It Does NOT Mean                       |
| -------------------- | -------------------------------------- | ------------------------------------------- |
| Shared context       | Load copilot-instructions.md once      | Skip gates because "context already loaded" |
| Incremental mode     | Analyze only changed files             | Skip gates because "few files changed"      |
| Lazy context         | Minimal context for lightweight agents | Skip entire gates                           |
| Structured reporting | JSON summaries vs full markdown        | Skip reporting gates                        |

### Gate Execution Contract

1. **MANDATORY EXECUTION:** All gates with `allow_skip: false` MUST execute
2. **NO DISCRETION:** Orchestrators cannot skip gates "for efficiency" or "to save tokens"
3. **ALLOWED SKIPPING:** Only if:
   - `allow_skip: true` in gate config, OR
   - `condition:` evaluates to false (conditional gates)
4. **LOGGING REQUIRED:** Every gate decision must be logged to `pipeline-state.json` with reason

### Before Skipping Any Gate

```typescript
// Pseudo-code enforcement
function canSkipGate(gateId: string): boolean {
  const gate = config.gates.find((g) => g.id === gateId);

  // Check 1: Is skipping explicitly allowed?
  if (!gate.allow_skip) {
    return false; // MUST EXECUTE
  }

  // Check 2: Does condition exist and evaluate to false?
  if (gate.condition && !evaluateCondition(gate.condition)) {
    return true; // Conditional skip
  }

  // Check 3: Log the decision
  logGateDecision({
    gate_id: gateId,
    decision: "skip",
    reason: `allow_skip: true`,
    authorized: true,
    timestamp: new Date().toISOString(),
  });

  return true;
}
```

### Violation Consequences

If a gate is skipped without authorization:

- ❌ Pipeline run marked as **INVALID**
- ⚠️ Warning added to dashboard report
- 📝 Violation recorded in sdlc-g8-meta-learner
- 🔄 Recommendation: Re-run from last valid checkpoint

### Example: Why SDLC_G4_TESTING Cannot Be Skipped

```yaml
# pipeline-config.yaml
- id: "SDLC_G4_TESTING"
  blocking: true
  allow_skip: false # ← THIS IS THE RULE
```

**Correct:** Execute SDLC_G4_TESTING with all agents (sdlc-g4-test-planner, developers, executor)  
**Wrong:** Skip SDLC_G4_TESTING "for efficiency" ← **VIOLATES CONTRACT**

---

## Gate Sequence

```
G0   → ENTRY          sdlc-g0-requirements-analyst (Sonnet) - blocks on vague description; generates REQ-IDs + NFR catalog
G0.5 → DESIGN         inline orchestrator (conditional: UI_SCREEN tasks) - blocks if no design artifact
G0.7 → ARCH_DRIFT     sdlc-g0.7-arch-drift (Sonnet) - conditional (>1 module changed); blocks on cross-module import violations
G1   → PLAN           sdlc-g1-feature-planner (Sonnet) - blocks for human approval; produces REQ traceability matrix
G1.5 → DIAGRAM        sdlc-g1.5-diagram-generator (Sonnet) - non-blocking, optional
G2   → IMPLEMENTATION sdlc-g2-rn-developer (Sonnet) - blocks if incomplete
G2.1 → LINT           sdlc-g2.1-lint (GPT-5 mini) - warns, auto-fixes
G2.2 → TYPECHECK      sdlc-g2.2-typecheck (GPT-5 mini) - blocks on errors
G2.3 → FRAMEWORK      sdlc-g2.3-framework-rules (Gemini 3 Flash) - warns; now checks API chain + loading state pattern
G2.4 → CIRCULAR       sdlc-g2.4-circular-deps (GPT-5 mini) - warns
G2.5 → SECURITY       sdlc-g2.5-security-specialist (Sonnet) - blocks on Critical/High
G2.6 → IMPORT         sdlc-g2.6-import-boundary (GPT-5 mini) - warns
G2.7 → API_CONTRACT   sdlc-g2.7-api-contract (GPT-5 mini) - validates typed service contracts; blocks on any (critical)
G2.8 → OBSERVABILITY  sdlc-g2.8-observability (GPT-5 mini) - validates analytics events + PII check; blocks on PII (critical)
G3   → REVIEW         sdlc-g3-senior-reviewer (Sonnet) - single-pass combined architecture + code review; blocks on 🔴 Critical
G4   → TESTING        sdlc-g4-test-planner + developers (Sonnet) + executor (Haiku) - layered coverage + REQ traceability; interactive auto-fix on failure
G4.5 → CONTRACT_TEST  sdlc-g4.5-contract-test (GPT-5 mini) - validates service contract tests (success+failure+edge); warns on missing
G5   → PERFORMANCE    sdlc-g5-performance-auditor (Gemini 3 Flash) - mandatory, non-blocking; enforced budgets (50/100 KB, 2s startup, 1.5s TTI)
G6   → ACCESSIBILITY  sdlc-g6-accessibility-auditor (Gemini 3 Flash) - mandatory, WCAG 2.1 AA; checks contrast ratio, keyboard nav, Dynamic Type
G7   → DEPENDENCIES   sdlc-g7-dependency-auditor (GPT-5 mini) - blocks on Critical/High npm vulnerabilities
G8   → COMPLETION     sdlc-g8-dashboard-generator + sdlc-g8-meta-learner (Haiku/Sonnet)
G9   → RELEASE        sdlc-g9-release-readiness (Haiku) - conditional (release_type != null); blocks on version mismatch, missing CHANGELOG
```

## Interactive Features (NEW — Added 2026-06-03)

### Interactive Test Fixing (SDLC_G4_TESTING)

When SDLC_G4_TESTING fails, the pipeline now offers **user-prompted auto-fix** instead of simply blocking:

**Workflow:**

1. **Detection:** SDLC_G4_TESTING fails (e.g., 28 test failures, 49% coverage)
2. **User Prompt:** "Would you like to auto-fix test issues and continue?"
3. **Decision:**
   - **YES** → Pipeline invokes `sdlc-g4-test-fixer` to:
     - Fix Jest configuration (moduleNameMapper, test environment)
     - Setup test utilities and mock providers
     - Fix async/timer isolation issues
     - Re-run tests until 80% coverage achieved
     - **Auto-continue to G5-G7 gates on success** ✨
   - **NO** → Pipeline stops with remediation guide reference

**Benefits:**

- ✅ Unblocks pipeline on fixable configuration issues
- ✅ Maintains 80% coverage quality gate
- ✅ User retains control over auto-fix decision
- ✅ Automatically executes downstream gates after fix
- ✅ Estimated 2-3 hours saved vs manual remediation

**Configuration:** See [interactive-test-fixing.instructions.md](.github/instructions/interactive-test-fixing.instructions.md)

**Applies to:** Any gate with `failure_action: 'ask_user_then_auto_fix'`

---

## Agent Registry (35 Agents)

### Planning

- `sdlc-g0-requirements-analyst` - G0, validates description, generates REQ-IDs + NFR catalog
- `sdlc-g0.7-arch-drift` - G0.7, architecture drift detection (conditional: >1 module changed)
- `sdlc-g1-feature-planner` - G1, creates user stories + REQ traceability matrix, awaits approval
- `sdlc-g1-change-area-mapper` - G1, maps files to feature modules
- `sdlc-g1.5-diagram-generator` - G1.5, PlantUML diagrams

### Implementation

- `sdlc-g2-rn-developer` - G2, implements RN code (pipeline + standalone)

### Quality

- `sdlc-g2.1-lint` - G2.1, ESLint
- `sdlc-g2.2-typecheck` - G2.2, TypeScript check (hard-blocking)
- `sdlc-g2.3-framework-rules` - G2.3, FinVault conventions + API chain validation
- `sdlc-g2.4-circular-deps` - G2.4, madge
- `sdlc-g2.5-security-specialist` - G2.5, OWASP audit
- `sdlc-g2.6-import-boundary` - G2.6, finvault/\* validation
- `sdlc-g2.7-api-contract` - G2.7, typed service contracts, no any in services
- `sdlc-g2.8-observability` - G2.8, screen view events, action events, no PII in analytics

### Review

- `sdlc-g3-senior-reviewer` - G3, combined single-pass architecture + code quality review
- `sdlc-g2.75-fixer` - auto-fixes Critical findings from security/framework gates
- `RN Code Reviewer` - standalone, read-only review

### Testing

- `sdlc-g4-test-planner` - G4, test strategy
- `sdlc-g4-unit-test-developer` - G4, Jest unit tests (Haiku model)
- `sdlc-g4-integration-test-developer` - G4, component + store tests (Haiku model)
- `sdlc-g4-e2e-test-developer` - G4, Detox tests
- `sdlc-g4-test-executor` - G4, runs Jest, validates layered coverage + REQ traceability
- `sdlc-g4-test-fixer` - G4 auto-fix, fixes Jest config/mocks/async issues (interactive fixing)
- `sdlc-g4.5-contract-test` - G4.5, validates service contract tests exist with typed mocks

### Audits

- `sdlc-g5-performance-auditor` - G5, bundle size (50/100 KB budgets), startup (2s), TTI (1.5s), skeleton check
- `sdlc-g6-accessibility-auditor` - G6, WCAG 2.1 AA, contrast ratio, keyboard nav, Dynamic Type
- `sdlc-g7-dependency-auditor` - G7, npm audit

### Infrastructure

- `sdlc-pipeline-orchestrator` - coordinates all gates
- `change-detector` - git diff, categorizes changes
- `metrics-tracker` - token usage, costs
- `sdlc-g8-dashboard-generator` - aggregates reports
- `sdlc-g8-meta-learner` - updates .github/ files
- `sdlc-g9-release-readiness` - G9, pre-release checklist (conditional: release_type set)

## Model Tiers

- **GPT-5 mini** - Structured output parsing, JSON analysis, checklist validation (G2.1, G2.2, G2.4, G2.6, G2.7, G2.8, G4.5, G7)
- **Gemini 3 Flash** - Rule checklists, pattern matching, convention checking (G2.3, G5, G6)
- **Haiku** (Claude Haiku 4.5) - Scripts, release checklist, G4 test developers (model override), metrics
- **Sonnet** (Claude Sonnet 4.6) - All other gates: planning, implementation, security, review, testing

## Token Reporting (All Agents)

Every agent must append to output:

```
**Tokens (estimated):** ~<input_k>k in / ~<output_k>k out / ~<total_k>k total
```

Calculation: total characters ÷ 4 ≈ tokens

## Output Structure

```
pipeline-output/
  checkpoint.md - resume point
  00-requirements/ - problem spec
  01-plan/ - feature plan, diagrams
  02-implementation/ - generated code
  03-quality/ - lint, typecheck, framework, circular, import, hooks reports
  04-security/ - security audit reports
  05-review/ - senior review + code review reports
  06-testing/ - test strategy, tests, coverage
  07-audits/ - performance, accessibility, dependency
  08-reports/ - dashboard, meta-learning
```

## Common Patterns

**Feature:** Full pipeline (G0→G8)  
**Bug (known):** Manual fix + validate  
**Bug (unknown):** Full pipeline  
**Enhancement (small):** Manual + validate  
**Enhancement (large):** Full pipeline  
**Review:** `@RN Code Reviewer`  
**Security:** `@sdlc-g2.5-security-specialist`

## Pipeline Change Rule (MANDATORY)

Whenever any of the following changes are made, **`pipeline-config.yaml` must also be updated in the same edit session**:

| Change                               | What to update in `pipeline-config.yaml`                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| New gate added to any `.agent.md`    | Add gate block under `gates:` + add routing entry under `execution_flow:`           |
| Gate renamed                         | Update `id` in gate block and all `execution_flow` references                       |
| Gate blocking behavior changed       | Update `blocking:` and `failure_action:` in gate block                              |
| Gate removed                         | Remove gate block and remove from `execution_flow:` and any `parallel_gates:` lists |
| Agent added to / removed from a gate | Update `agents:` list in gate block                                                 |
| Gate model tier changed              | Update `model:` in gate block                                                       |
| Gate ordering changed                | Update `next_on_success` / `next_on_failure` routing in `execution_flow:`           |

**Why:** `sdlc-pipeline-orchestrator.enforcer.ts` reads `pipeline-config.yaml` at runtime. The agent `.md` files describe intent; the config drives actual execution. A gate that exists in an agent spec but not in `pipeline-config.yaml` will be silently skipped by the enforcer.
**Health Check:** `@sdlc-pipeline-orchestrator validate`
