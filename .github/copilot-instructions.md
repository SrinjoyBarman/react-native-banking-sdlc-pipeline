# FinVault App — Copilot Instructions

These are the core rules that apply to **every** conversation and agent in this repository.

## Sensitive Files

**Critical Rule:** Never read, write, display, summarize, or reference the contents of `.env`, `.env.*`, or any file containing secrets — even if it appears in the editor context.

See: [sensitive-files.instructions.md](instructions/sensitive-files.instructions.md)

## Project Structure

React Native digital banking app with feature-based feature modules under `src/*/`.

### Quick Reference

- **Tech:** React Native 0.86.0, TypeScript 5 (strict), Redux + Redux-Saga
- **Modules:** `core` (framework), `shared` (UI), `store` (composition root), `auth`, `dashboard`, `payments`, `cards`, `profile`, `onboarding`, `storage`
- **Import Rule:** Use `finvault/*` aliases only — never deep relative paths

See: [project-architecture.instructions.md](instructions/project-architecture.instructions.md)

## Component Standards

- **Syntax:** `React.FC<Props>` arrow functions only — never `function` keyword
- **Props:** Separate `ComponentName.types.ts` file
- **Logic:** Extract to co-located hooks (pages → `useXScreen`, organisms → `useX`)
- **Folder:** `ComponentName/` with `.tsx`, `.styles.ts`, `.types.ts`, `index.ts`

See: [component-standards-base.instructions.md](instructions/component-standards-base.instructions.md)  
See also: [component-refactoring.instructions.md](instructions/component-refactoring.instructions.md) for refactoring tasks

## State & API

- **Mandatory API Chain:** Screen → hook → saga → service → ApiService (no layer skipped)
- **Selectors:** Named exports in `*Selectors.ts` — no inline lambdas
- **Loading State:** Must include `'idle'` check: `isLoading = status === 'idle' || status === 'loading'`

See: [state-and-api.instructions.md](instructions/state-and-api.instructions.md)

## TypeScript & Code Quality

- **No `any`** — use `unknown` + type guards
- **Naming:** camelCase (variables/functions), PascalCase (components/types), UPPER_SNAKE_CASE (constants)
- **Quality:** No dead code, TODOs, or magic values. Max 30 lines/function, 300 lines/file, 3 levels nesting
- **Immutability:** Use `Readonly<T>`, `as const`, spread operators

See: [typescript-coding.instructions.md](instructions/typescript-coding.instructions.md)

## UI & Testing

- **UI:** Design tokens only (no hardcoded colors), `testID` on all interactive elements, `FlatList` for lists
- **Tests:** 80% minimum coverage, success/failure/edge cases for all hooks/sagas
- **Skeleton Loading:** Render skeleton for `'idle'` and `'loading'` states

See: [ui-and-testing.instructions.md](instructions/ui-and-testing.instructions.md)

## Security & Reviews

- **Secrets:** Never in source code. Auth tokens via `react-native-keychain` only
- **Validation:** All user input validated before dispatch
- **Audits:** `npm audit` must show no Critical/High in production deps
- **Reviews:** 🔴 Must fix | 🟡 Should address | ℹ️ Informational

See: [security-and-review.instructions.md](instructions/security-and-review.instructions.md)

## Agentic SDLC Pipeline

FinVault has a comprehensive 28-agent pipeline for automated quality assurance.

### Pipeline Change Rule (MANDATORY)

Whenever a gate is added, renamed, reordered, or has its blocking/agents/model changed in **any** `.github/agents/*.agent.md` or `.github/instructions/pipeline-reference.instructions.md`, **update `.github/pipeline-config.yaml` in the same edit session**. The enforcer reads the YAML at runtime — agent spec changes without a config update are silently ignored.

- New gate → add `gates:` block + `execution_flow:` routing entry
- Gate removed → remove block + remove from `execution_flow:` and `parallel_gates:`
- Blocking change → update `blocking:` + `failure_action:`
- Agent list change → update `agents:` list
- Order change → update `next_on_success` / `next_on_failure`

### Quick Invocation

```bash
# Full pipeline (features, complex bugs)
@sdlc-pipeline-orchestrator <feature description>

# Validation only (quick health check)
@sdlc-pipeline-orchestrator validate

# Resume from checkpoint
@sdlc-pipeline-orchestrator resume
```

### Interactive Features (NEW)

**Interactive Test Fixing:** When SDLC_G4_TESTING fails, the pipeline prompts: "Would you like to auto-fix test issues and continue?" If yes, it automatically fixes Jest config/mocks, achieves 80% coverage, then auto-executes all following gates. See [interactive-test-fixing.instructions.md](instructions/interactive-test-fixing.instructions.md)

### Common Agents

- **Implementation:** `@sdlc-g2-rn-developer` - RN code generation (pipeline + standalone)
- **Review:** `@RN Code Reviewer` - Read-only architecture review
- **Security:** `@sdlc-g2.5-security-specialist` - OWASP audit
- **Quality:** `@sdlc-g2.1-lint`, `@sdlc-g2.2-typecheck`, `@sdlc-g2.3-framework-rules`
- **API Contract:** `@sdlc-g2.7-api-contract` - typed service contracts, no any in services
- **Observability:** `@sdlc-g2.8-observability` - analytics events + PII check
- **Arch Drift:** `@sdlc-g0.7-arch-drift` - cross-module import violations (conditional)
- **Testing:** `@sdlc-g4-test-planner`, `@sdlc-g4-unit-test-developer`, `@sdlc-g4-test-executor`, `@sdlc-g4.5-contract-test`
- **Release:** `@sdlc-g9-release-readiness` - pre-release checklist (conditional)

See: [pipeline-reference.instructions.md](instructions/pipeline-reference.instructions.md) for full agent registry and gate sequence  
User Guide: [.github/documentation/sdlc-pipeline-guide.md](documentation/sdlc-pipeline-guide.md)

## Instruction Files

Detailed standards are split into focused instruction files with `applyTo` patterns for efficiency:

- **Project Architecture:** Module boundaries, dependency graph, import aliases
- **Component Standards:** Syntax, folder structure, logic extraction
- **State & API:** Redux patterns, saga rules, mandatory API chain
- **TypeScript & Coding:** Type patterns, naming, code quality, circular deps
- **UI & Testing:** Design tokens, accessibility, skeleton loading, test coverage
- **Security & Review:** Secrets management, input validation, review checklist
- **API Design:** Service layer contracts, typed request/response, error propagation (`src/**/services/**`)
- **Analytics:** Screen view events, action events, PII rules, event naming constants
- **Native Integration:** Native module patterns, bridge safety, platform files (`ios/`, `android/`)
- **Release Management:** Version consistency, CHANGELOG, debug flags, env var docs
- **Pipeline Reference:** 21 gates, 35 agents, gate sequence, model tiers

Each instruction file is loaded contextually based on the file paths you're working with.

## Continuous Learning

When a conversation produces a new framework decision or improvement:

1. Identify affected `.github/` files (instruction files or agent definitions)
2. Apply changes immediately so rules are enforced from next interaction
3. Preserve formatting, terminology, and structure consistency

This ensures institutional knowledge is captured and the project continuously improves.
