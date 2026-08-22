# Meta-Learning Report

**Run:** BKIEMOB-9/run-001  
**Date:** 2026-07-17  
**Feature:** OTP Auth Registration Screen — mobile input, OTP entry, submit flow

---

## Patterns Identified

### Recurring Violations (appeared in 2+ files or categories)

| Violation | Count | Severity | Action Taken |
|---|---|---|---|
| Hardcoded hex colors in `*.styles.ts` | 2+ files | 🔴 Blocking (G2.3) | Added `backgroundLogin` and `borderMedium` tokens to `theme.ts`; codified "add token first" rule in `component-standards-base.instructions.md` |
| Input validation too permissive | 2 fields (OTP + mobile) | 🔴 Blocking (G2.5) | Added exact-length OTP guard and numeric-only filter rule to `security-and-review.instructions.md` |
| Repeated Pressable JSX not extracted to atom | 1 component (C2) | 🔴 Blocking (G3) | Already covered by `component-standards-base.instructions.md` primitive-reuse rule — violation was developer non-compliance, not a rule gap |
| Feature-local ActionButton shared across modules (C3) | 1 component | 🔴 Blocking (G3) | Already covered by module boundary rules — rule gap: no positive example of "promote to shared" workflow |
| `takeLatest` used for non-idempotent auth action (C1) | 1 saga | 🔴 Blocking (G3) | Already covered by `state-and-api.instructions.md` — developer non-compliance, not a rule gap |
| `jest.mock()` factory referencing outer scope variable | 1 test file | 🟡 Test failure | Added `jest.mock()` factory scope rule to `ui-and-testing.instructions.md` |
| `react-redux` missing from `transformIgnorePatterns` | Jest config | 🟡 Config | Previously codified (login-screen run). `sdlc-g4-test-fixer` should treat as first-check item |
| `@types/node` missing for `fs`/`path` in security audit tests | Jest config | 🟡 Config | Added `@types/node` note to `ui-and-testing.instructions.md` |
| PII in mock service response `message` field | 1 service mock | 🔴 Security (G2.5) | Added "Mock/Test Data — No PII" rule to `security-and-review.instructions.md` |
| Circular dependency: `store.ts` → auth barrel → store | 1 architecture | 🔴 Blocking (G2.3) | Added circular dependency pattern to `project-architecture.instructions.md` |

---

## New Rules Codified

| Rule | Added To |
|---|---|
| Store composition root must import feature internals directly (not barrels) to prevent cycles | [project-architecture.instructions.md](../../.github/instructions/project-architecture.instructions.md) |
| `jest.mock()` factory functions cannot reference outer-scope variables; use inline values or `jest.requireActual()` | [ui-and-testing.instructions.md](../../.github/instructions/ui-and-testing.instructions.md) |
| `@types/node` required for security audit tests using `fs`/`path` | [ui-and-testing.instructions.md](../../.github/instructions/ui-and-testing.instructions.md) |
| Add design-spec colour tokens to `theme.ts` first, then reference by name — never implement a one-off hex literal | [component-standards-base.instructions.md](../../.github/instructions/component-standards-base.instructions.md) |
| New theme tokens: `backgroundLogin`, `borderMedium` documented in token reference table | [component-standards-base.instructions.md](../../.github/instructions/component-standards-base.instructions.md) |
| OTP/code fields: validate `length === N`, not just `!!value` | [security-and-review.instructions.md](../../.github/instructions/security-and-review.instructions.md) |
| Numeric inputs: apply `replace(/[^0-9]/g, '')` filter in `onChange` handler — do not rely on `keyboardType` alone | [security-and-review.instructions.md](../../.github/instructions/security-and-review.instructions.md) |
| Mock service responses must not contain PII — use synthetic values (`user@example.com`, `+1234567890`) | [security-and-review.instructions.md](../../.github/instructions/security-and-review.instructions.md) |

---

## Gate Performance

| Gate | Result | Notes |
|---|---|---|
| SDLC_G2.3 Framework Rules | ⚠️ Warn → Fixed | 2 hardcoded hex violations. High-ROI gate for style enforcement. |
| SDLC_G2.5 Security | ⚠️ Warn → Fixed | 3 input validation gaps + 1 PII mock leak. Highest ROI gate this run. |
| SDLC_G3 Review | ❌ Fail → Fixed | 3 critical blockers (C1 saga effect, C2 atom extraction, C3 module placement). Code review remains the highest friction point. |
| SDLC_G4 Testing | ⚠️ Warn → Fixed | 2 Jest config gaps (`jest.mock()` scope, `@types/node`). Branch coverage required dedicated render tests for pure JSX components. |

---

## Root Cause Analysis

### Why did C1–C3 reach G3 (not caught at G2)?

- **C1 (`takeLatest` → `takeLeading`):** Rule exists in `state-and-api.instructions.md`. G2.3 framework-rules agent does not currently pattern-match saga effect selection for auth actions. **Recommendation:** Add `takeLatest.*auth` static analysis check to `sdlc-g2.3-framework-rules.agent.md`.
- **C2 (Repeated Pressable):** Rule exists in `component-standards-base.instructions.md`. G2.3 does not count duplicate JSX primitive patterns within a file. **Recommendation:** Count repeated `<Pressable`/`<TouchableOpacity` blocks — flag if count > 1 with identical structure.
- **C3 (Feature-local shared component):** Module boundary check exists but no positive-direction rule says "if a component is used by 2+ feature modules, move it to `shared/`". **Recommendation:** Add a "promote to shared" threshold rule.

### Why did hex colors recur (also flagged in login-screen run)?

Hardcoded hex in `*.styles.ts` has now appeared in **two consecutive runs**. The static analysis check recommended in the previous run's learnings has not been implemented in `sdlc-g2.3-framework-rules.agent.md`. This is now a **high-priority enforcement gap**.

### Why did `jest.mock()` scope cause a test failure?

Babel hoisting behavior is a well-known Jest footgun. This has not previously been documented in project instructions. Now codified.

---

## Recommendations for Future Runs

### High Priority (prevent recurrence)

1. **Add hex-literal static analysis to G2.3** — scan `*.styles.ts` for `#[0-9a-fA-F]{3,8}` and fail if found. This violation has appeared in 2 runs and is preventable at G2.
2. **Add auth saga effect check to G2.3** — flag `takeLatest` in sagas whose action name contains `login`, `auth`, `submit`, or `payment`.
3. **Add "promote to shared" threshold to G3 review checklist** — if a component is referenced from 2+ feature modules, it belongs in `shared/`.

### Medium Priority (improve coverage)

4. **Pure JSX component test template** — `sdlc-g4-unit-test-developer` should automatically generate a render test for components with no logic (covering the `isLoading` and `!isLoading` branches at minimum).
5. **`jest.mock()` factory linting** — consider an ESLint rule that warns when a `jest.mock()` factory references a variable declared in the outer scope.

### Low Priority (process)

6. **G3 blocker rate target** — this run had 3 critical blockers from G3. If G3 consistently produces 3+ blockers, consider adding a pre-review static-analysis pass (G2.6 component-structure?) to catch C2/C3 class issues before the full review.

---

## Changes Applied This Session

- [.github/instructions/project-architecture.instructions.md](../../.github/instructions/project-architecture.instructions.md): Added "Circular Dependency Prevention" section — store composition root must import feature internals directly
- [.github/instructions/ui-and-testing.instructions.md](../../.github/instructions/ui-and-testing.instructions.md): Added `jest.mock()` factory scope rule and `@types/node` for security audit tests
- [.github/instructions/component-standards-base.instructions.md](../../.github/instructions/component-standards-base.instructions.md): Added "Design Tokens in Component Styles" section with `backgroundLogin`/`borderMedium` token table
- [.github/instructions/security-and-review.instructions.md](../../.github/instructions/security-and-review.instructions.md): Strengthened Input Validation section (OTP exact-length, numeric filter); added Mock/Test Data No-PII rule
