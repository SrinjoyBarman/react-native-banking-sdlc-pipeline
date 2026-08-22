# FinVault — React Native Banking SDLC Pipeline

A production-grade **agentic SDLC pipeline** for a React Native digital banking app. The repository contains the full GitHub Copilot agent configuration, instruction files, and pipeline orchestration system that automates the end-to-end software development lifecycle — from requirements analysis through release readiness — using 35+ specialized AI agents.

---

## What's in this Repository

```
.github/
  agents/                  35 specialized Copilot agent definitions (.agent.md)
  instructions/            17 instruction files with coding standards (applyTo patterns)
  pipeline-config.yaml     Central gate configuration (version, model tiers, blocking rules)
  copilot-instructions.md  Root instructions loaded for every conversation
pipeline-output/           Local pipeline run artefacts (gitignored)
```

---

## Tech Stack (Target App)

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | React Native 0.86.0                |
| Language   | TypeScript 5 (`strict: true`)      |
| State      | Redux Toolkit + Redux-Saga         |
| Navigation | React Navigation                   |
| Auth       | react-native-keychain + biometrics |
| HTTP       | axios via typed `ApiService`       |
| Tests      | Jest + react-test-renderer         |

---

## Agentic SDLC Pipeline

The pipeline is invoked via GitHub Copilot Chat and executes up to **28 quality gates** in sequence:

```
G0   Requirements Analysis      → validates feature spec & acceptance criteria
G0.7 Architecture Drift         → detects cross-module violations (conditional)
G1   Feature Planning           → dependency-ordered user stories + dev plan
G1.5 Diagram Generation         → PlantUML architecture & sequence diagrams
G2   Implementation             → RN code generation (FinVault standards enforced)
G2.1 Lint                       → ESLint with auto-fix
G2.2 Type Check                 → TypeScript compiler (tsc --noEmit)
G2.3 Framework Rules            → project-specific convention validation
G2.4 Circular Dependencies      → madge cycle detection
G2.5 Security Audit             → OWASP Top 10, secrets, input validation
G2.6 Import Boundary            → module dependency graph enforcement
G2.7 API Contract               → typed request/response shapes, no `any` in services
G2.75 Auto-Fixer                → automated remediation (max 3 iterations)
G2.8 Observability              → analytics events + PII check
G3   Code Review                → architecture + code quality (senior reviewer)
G4   Testing                    → test strategy → unit/integration/E2E → execution
G4.5 Contract Tests             → service contract coverage validation
G5   Performance Audit          → bundle size, TTI, memory (advisory)
G6   Accessibility Audit        → VoiceOver, Dynamic Type, testID compliance
G7   Dependency Audit           → npm audit (blocks on Critical/High)
G8   Dashboard + Meta-Learning  → pipeline run summary + learnings capture
G9   Release Readiness          → version bumps, CHANGELOG, debug flags (conditional)
```

### Invocation

```bash
# Full pipeline run
@sdlc-pipeline-orchestrator BANK-123: Add MPIN setup screen

# Validation-only run
@sdlc-pipeline-orchestrator validate

# Resume from last checkpoint
@sdlc-pipeline-orchestrator resume
```

---

## Module Architecture

```
src/
  core/         Framework kernel — ApiService, theme, constants, routes, utils
  shared/       Shared UI components (atoms/molecules)
  store/        Redux composition root — store, typed hooks
  auth/         Auth module — login, biometric, token management
  onboarding/   First-launch flow
  dashboard/    Account overview, balance
  payments/     Transfers, bill pay
  cards/        Card management, limits
  profile/      Settings, preferences
  storage/      MMKV + Keychain wrappers
```

**Import rule:** Use `finvault/*` path aliases only. Never deep relative imports across modules.

---

## Coding Standards

All standards are enforced via instruction files in `.github/instructions/` and validated by pipeline agents:

- **No `any`** — use `unknown` + type guards
- **Mandatory API chain:** Screen → Hook → Saga → Service → ApiService (no layer skipped)
- **Component syntax:** `React.FC<Props>` arrow functions, logic in co-located hooks
- **Sensitive data:** Auth tokens via `react-native-keychain` only; never in Redux or AsyncStorage
- **Crypto:** `crypto.getRandomValues()` for security-critical randomness; never `Math.random()`
- **Testing:** ≥ 80% coverage, success + failure + edge cases required
- **Secrets:** Never in source code; `.env*` files are gitignored

---

## Security

- Secrets are managed via `.env` files (gitignored) and `react-native-keychain`
- `npm audit` must show no Critical or High vulnerabilities in production dependencies
- All user input is validated before dispatch; OTP/PIN fields use exact-length checks
- MPIN/PIN are never passed through navigation params

---

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in values (never commit `.env*`)
3. Install dependencies: `npm install`
4. Install iOS pods: `cd ios && pod install`
5. Run on iOS: `npx react-native run-ios`
6. Run on Android: `npx react-native run-android`
7. Run tests: `npm test`

---

## Pipeline Configuration

Gate behaviour, model assignments, and blocking rules are controlled by `.github/pipeline-config.yaml`.

Key rules:

- Gates with `allow_skip: false` are **mandatory** — they cannot be skipped for any reason including token optimisation
- Gates with `blocking: true` will halt the pipeline on failure
- Conditional gates (e.g. G9 release readiness) execute only when their condition is met

---

## Contributing

All changes go through the agentic SDLC pipeline. See `.github/copilot-instructions.md` for the full coding standards applied to every conversation.
