---
description: >
  Use when: writing TypeScript code, defining types, naming files/variables/functions,
  or enforcing code quality rules. Covers TypeScript patterns, naming conventions,
  and general code quality standards.
applyTo: 'src/**/*.{ts,tsx}'
---

# TypeScript & Coding Standards

## TypeScript Standards

- `strict: true` — no exceptions
- **No `any`** — use `unknown` + type guards when type is truly unknown
- `interface` for object shapes
- `type` for unions, intersections, mapped types
- `as const` for literal objects (action types, route maps, endpoint maps)
- Avoid `as` casts — use type guards instead
- Never `as any` — this is a hard violation
- Use generics for reusable code
- Utility types (`Omit`, `Pick`, `Partial`, `Readonly`, `Record`) over manual redefinitions

### Discriminated Unions

Prefer discriminated unions for state machines and variant types:

```ts
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError };
```

## Naming Conventions

| What                          | Convention                                 | Example                              |
| ----------------------------- | ------------------------------------------ | ------------------------------------ |
| Variables, functions          | `camelCase`                                | `getUserBalance`, `isLoading`        |
| React components              | `PascalCase`                               | `TransactionCard`, `DashboardScreen` |
| Types, interfaces             | `PascalCase`                               | `PaymentPayload`, `CardDetails`      |
| Enums                         | `PascalCase` members in `UPPER_SNAKE_CASE` | `AuthStatus.LOGGED_IN`               |
| Constants                     | `UPPER_SNAKE_CASE`                         | `MAX_PIN_ATTEMPTS`, `API_TIMEOUT_MS` |
| Files: components             | `PascalCase`                               | `TransactionCard.tsx`                |
| Files: hooks, utils, services | `camelCase`                                | `useAuth.ts`, `formatCurrency.ts`    |
| Files: types                  | `camelCase.types.ts`                       | `payment.types.ts`                   |
| Test files                    | match source + `.test.ts(x)`               | `useAuth.test.ts`                    |

## Code Quality Rules

- **No dead code** — remove unused imports, variables, functions
- **No `// TODO` in shipped code** — resolve or create Jira ticket
- **No magic values** — extract to named constants
- **Max function length:** ~30 lines
- **Max file length:** ~300 lines
- **Max nesting:** 3 levels
- **Early returns** over nested `if/else`
- **DRY principle:** Extract only when repeated 3+ times
- **Immutability:** Use `Readonly<T>`, `ReadonlyArray<T>`, `as const`, spread operators over mutation

**Test Code Quality:**
Test files (in `__tests__/` directories) are NOT exempt from these rules. Common issue: unused destructured variables from test utilities (`rerender`, `waitFor`, etc.) — only destructure what you actually use.

**Test-Specific TypeScript Patterns:**

Navigation prop mocks — use double assertion via `Partial` to avoid TS2352:

```ts
// ❌ Wrong — TS error: types don't sufficiently overlap
const mockNavigation = {
  navigate: jest.fn()
} as SplashScreenProps['navigation'];

// ✅ Correct
const mockNavigation = {
  navigate: jest.fn()
} as Partial<
  SplashScreenProps['navigation']
> as SplashScreenProps['navigation'];
```

`rerender` from `renderHook` requires the props argument:

```ts
// ❌ Wrong — TS2554: Expected 1 argument, got 0
rerender();

// ✅ Correct
rerender(props);
```

`configureStore` reducer map must match preloadedState — no phantom keys:

```ts
// ❌ Wrong — _init is not a declared reducer
configureStore({
  reducer: { _init: () => ({}), onboarding: onboardingReducer }
});

// ✅ Correct — typed mock state interface
interface MockStoreState {
  readonly onboarding: OnboardingState;
}
const createMockStore = (preloadedState?: MockStoreState) =>
  configureStore({
    reducer: { onboarding: onboardingReducer },
    ...(preloadedState && { preloadedState })
  });
```

`jest.MockedFunction<typeof fn>` for function mocks (not `jest.Mocked` which is for whole objects):

```ts
// ✅ Correct
const mockGetSecure = getSecure as jest.MockedFunction<typeof getSecure>;
mockGetSecure.mockResolvedValue(null);
```

### Immutability Examples

```ts
// ✅ Correct
const newState = { ...state, isLoading: true };
const newArray = [...items, newItem];

// ❌ Wrong
state.isLoading = true;
items.push(newItem);
```

## Build Scripts

- Node.js scripts in `scripts/` use **CommonJS** (`require`, `module.exports`) for Node 18 compatibility
- Build scripts are exempt from ES6 module lint rules (excluded via `.eslintrc.js` ignorePatterns)
- Keep scripts focused and single-purpose — test report generation, coverage summaries, build automation
- No React Native or app logic in build scripts

## Circular Dependencies

- **No circular dependencies** — verify with `npm run check:circular`
- If madge reports a cycle, refactor to extract shared code to a lower-level module
- Common fix: move shared types/interfaces to a separate `types.ts` file
