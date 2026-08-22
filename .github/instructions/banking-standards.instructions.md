---
applyTo: "src/**"
---

# Banking Standards — DigitalBanking React Native (Frontend)

> Binding for all engineers and AI agents working in the RN client. Non-conforming changes MUST NOT be merged.
> Security, authentication, API resilience, and error-handling rules live in their respective instruction files.

**Rule #0 — The client is untrusted.** The server is the sole source of truth for amounts, balances, fees, limits, and authorization. The client MUST NEVER compute, store as final, or act as authority for any of these.

## 1. Money Representation & Types

Money MUST be integer minor units or a typed `Money` object. `number` (float) MUST NOT be used for monetary values. All arithmetic MUST use `dinero.js` or `big.js` — ad-hoc arithmetic on raw numbers MUST NOT occur.

> **Pattern:** [Rule 1 — Money Representation](../enforcement/patterns/banking-standards.patterns.ts)

## 2. Calculation Rules

- Rounding MUST use half-up at defined output boundaries only; MUST NOT round mid-calculation.
- Decimal places MUST be currency-specific — exponents are defined in [`CURRENCY_EXPONENTS`](../enforcement/constants/decimal-constants.ts); hardcoding any decimal count is MUST NOT.
- **API decimal contract consistency:** Every API response carrying a monetary value MUST declare or imply a fixed decimal precision that matches `CURRENCY_EXPONENTS` for that currency. If a response value's inferred decimal count differs from the canonical exponent (e.g. an endpoint returns 3 decimal places for USD instead of 2), the API client layer MUST throw a `DecimalContractError`, log the discrepancy (field name, received precision, expected precision, currency), and surface a user-visible "something went wrong" error — MUST NOT silently coerce the value. Mismatches MUST be treated as a data contract violation and escalated to the BE team.
<!-- TODO: audit all existing API response mappers against CURRENCY_EXPONENTS and raise contract violations with the BE team before go-live. -->
- Arithmetic operates in minor units; division is last.
- Cross-currency arithmetic MUST NOT occur; every `Money` value carries its `CurrencyCode`.
- FX rates MUST come from the server at conversion time; client-side rates are display-only.
- Interest/APR, fees, taxes, and aggregation totals MUST be computed server-side.

> **Pattern:** [Rule 2 — API Decimal Contract](../enforcement/patterns/banking-standards.patterns.ts)

## 3. Idempotency, Concurrency & Atomicity

- Every money-moving API call MUST carry an `Idempotency-Key` (UUID v4, generated per user action, reused on retry).
- Balance operations MUST use optimistic locking / version tokens; stale-version conflicts MUST error, not silently overwrite.
- Money operations MUST be atomic; partial/indeterminate states MUST NOT persist.

## 4. Transaction State Machine

<!-- TODO: follow up with BA — verify all allowed state transitions and terminal states before treating this as final. -->

`INITIATED → PENDING → AUTHORIZED → PROCESSING → POSTED | FAILED | REVERSED`

> **Pattern:** [Rule 4 — Transaction State Machine](../enforcement/patterns/banking-standards.patterns.ts)

Transitions outside allowed edges are MUST NOT; ad-hoc/implicit states are MUST NOT. The client MUST reflect server-authoritative state only — never infer or transition state client-side. High-value transfers and new-payee additions MUST require step-up auth (OTP) before reaching `AUTHORIZED`.

## 5. Sensitive Data Handling (PII / PCI)

| Classification | Examples | Client rule |
|---|---|---|
| Regulated | Full PAN, CVV | MUST NOT store or log; tokenize via gateway only |
| Sensitive | Account number, IBAN, sort code | Masked in UI; not logged; in-memory only |
| Internal | Transaction IDs, correlation IDs | Not logged at DEBUG in production |

Full PAN MUST NOT transit our systems — use gateway hosted-fields (PCI scope minimisation). Sensitive fields MUST suppress clipboard. Masking MUST happen at the data layer before any component receives the value.

## 6. Approved Gateways & Integrations

Calling non-allowlisted endpoints or adding unapproved third-party SDKs MUST NOT occur without security sign-off.

> **Pattern:** [Rule 6 — Approved Gateways](../enforcement/patterns/banking-standards.patterns.ts)

Gateway hosted-fields/SDKs MUST be used so PAN never traverses our code.

## 7. Compliance & Regulatory (Client Obligations)

- Compliance-related UI flows (KYC, AML prompts, consent screens, transaction limit warnings) MUST NOT be skippable or dismissible without a server-acknowledged response.
- PII MUST NOT be persisted beyond the active session; MUST be cleared on logout.
- The client MUST surface server-returned limit/block decisions without override — MUST NOT suppress or reroute them.

## 8. Time, Timezone & Business-Day Rules

- Timestamps received from the server MUST be displayed in the user's locale timezone; MUST NOT be re-interpreted or offset client-side.
- Value dates, cutoff times, and business-day rules MUST come from the server; MUST NOT be hardcoded or computed in the client.

## 9. Testing Standards for Financial Code

- Calculation functions MUST have golden/snapshot tests covering all currency decimal variants.
- Rounding and conversion logic MUST have property-based tests (e.g. fast-check).
- Money-path tests MUST be deterministic; flaky tests MUST NOT be merged.
- Critical money paths MUST maintain ≥95% branch coverage, enforced in CI.

> **Pattern:** [Rule 9 — Testing Standards for Financial Code](../enforcement/patterns/banking-standards.patterns.ts)

## 10. PCI DSS Compliance (v4.0)

> TLS 1.2+, certificate pinning, jailbreak/root detection, screen-capture prevention, and dependency vulnerability scanning are covered in `security-standards.instructions.md` and apply to all CHD-touching code. This section covers the PCI DSS obligations specific to the cardholder data lifecycle.

### Sensitive Authentication Data (SAD)
- SAD — CVV2/CVC2, full magnetic-stripe / chip track data, PIN blocks — MUST NOT be stored after authorisation completes. This applies regardless of encryption, including in-memory component state, Redux store, MMKV, AsyncStorage, or logs.
- The post-authorisation prohibition applies even if the data was encrypted during the transaction window.

### Memory Hygiene
- CHD held in component state or local variables MUST be cleared (nulled / emptied) immediately after the operation that requires it completes. CHD MUST NOT persist in component state across re-renders or screen transitions.

### Audit Logging for CHD Access
- Every action that reads, displays, or transmits CHD (e.g. render card details, initiate payment) MUST emit an audit-log event at the service layer containing the actor, operation, and timestamp. The log entry MUST NOT contain the CHD itself.

## 11. Anti-Patterns (MUST NOT)

Floats for money · client-computed final amounts/balances · trusting client-side authorization · non-idempotent payment calls · logging CHD in any log sink · calling non-allowlisted payment gateways · indeterminate transaction states · cross-currency arithmetic without explicit conversion · silently coercing decimal contract mismatches instead of throwing `DecimalContractError` · non-deterministic or flaky money-path tests · storing SAD post-authorisation in any form · retaining CHD in component state beyond the requiring operation · emitting an audit log entry that contains CHD.

## 12. Definition of Done & Enforcement

| Rule | Enforcement mechanism |
|---|---|
| No floats for money | TypeScript `Money` type; custom ESLint rule banning `number` for amount fields |
| Idempotency key present | Server-side validation + client ESLint rule on API call wrappers |
| Decimal contract consistency | API mapper unit tests assert `DecimalContractError` on precision mismatch |
| State machine valid | Server enforces; TypeScript discriminated union on client |
| Financial test coverage | CI coverage gate: ≥95% branch coverage on money paths; golden + property-based tests required |
| Audit log on money ops | Integration test asserting audit entry exists for each flow |
| SAD not stored post-auth | SAST rule; code review checklist; no CVV/track fields in Redux state shape |
| Memory hygiene | Code review; SAST for CHD field presence in persistent state |

**Merge checklist for any money-touching change:**
- [ ] `Money` type used; no raw `number` for amounts; approved library for all arithmetic.
- [ ] Idempotency key generated and reused correctly on retry.
- [ ] API response mappers validate decimal precision against `CURRENCY_EXPONENTS`; `DecimalContractError` thrown on mismatch.
- [ ] No CHD in logs, state, or bundle.
- [ ] Transaction state machine transitions validated server-side.
- [ ] OTP step-up wired for high-value / sensitive operations.
- [ ] Golden + property-based tests added/updated; ≥95% coverage on money path.
- [ ] SAD (CVV, track data) not stored post-authorisation in any layer — state, MMKV, cache, or logs.
- [ ] CHD cleared from component state and local variables after the requiring operation.
- [ ] CHD access audit-logged (event + actor only — no CHD in the log entry).
- [ ] `yarn lint` and `yarn tsc --noEmit` exit 0.
