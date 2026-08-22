---
description: >
  Use when: building UI components, implementing screens, handling user interactions,
  or writing tests. Covers UI patterns, accessibility, skeleton loading, and
  comprehensive testing standards.
applyTo: "src/**/*.{tsx,test.ts,test.tsx}"
---

# UI & Testing Standards

## UI Rules

### Design Tokens

- **No dynamic color values** — use design tokens from `core/theme/theme.ts`
- Never hardcode colors, spacing, or typography values
- Import theme constants: `import { colors, spacing, typography } from 'finvault/core';`

### Accessibility

- **`testID` on all interactive/pressable elements** for E2E and accessibility
- `testID` naming: `kebab-case` descriptive identifiers (e.g., `login-button`, `amount-input`)
- **`accessibilityLabel` is required alongside `testID`** on every Pressable, TouchableOpacity, and interactive View
- Number pad / keypad keys must describe digit and action: `accessibilityLabel="Enter digit 1"`
- Touch targets minimum 44×44 points
- Support VoiceOver with proper `accessibilityLabel` and `accessibilityHint`

```tsx
// ✅ Correct
<Pressable
  testID="number-pad-key-1"
  accessibilityLabel="Enter digit 1"
  onPress={() => onPress('1')}
/>

// ❌ Wrong — missing accessibilityLabel, screen readers cannot describe the key
<Pressable testID="number-pad-key-1" onPress={() => onPress('1')} />
```

### Lists

- Use `FlatList` for dynamic-length lists
- **Never** `.map()` inside `ScrollView` for variable-length data
- Always provide `keyExtractor` (never use array index as key)
- Extract `renderItem` as a named const outside JSX

```tsx
// ✅ Correct
const renderTransaction = ({ item }: { item: Transaction }) => (
  <TransactionCard transaction={item} />
);

<FlatList
  data={transactions}
  renderItem={renderTransaction}
  keyExtractor={item => item.id}
/>

// ❌ Wrong
<ScrollView>
  {transactions.map((t, index) => <TransactionCard key={index} transaction={t} />)}
</ScrollView>
```

### Content

- **No hardcoded user-facing strings in TSX** — store display text in `constants/` inside the owning feature module
- No inline objects/functions in JSX for frequently rendered components
- Extract event handlers to named functions in the component hook

## Skeleton Loading

Prevent flash-of-empty-state on initial render:

```tsx
export const DashboardScreen: React.FC = () => {
  const { isLoading, balance, transactions } = useDashboardScreen();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <DashboardContent balance={balance} transactions={transactions} />;
};
```

**Critical:** `isLoading` must be `true` for both `'idle'` and `'loading'` status:

```ts
const isLoading = status === "idle" || status === "loading";
```

## Timer & Animation Cleanup

Always clean up `setTimeout`, `setInterval`, and `Animated` sequences in `useEffect` cleanup to prevent memory leaks and stale navigation calls on unmount.

Splash screens and intro animations are the most common source of this pattern:

```ts
// ✅ Correct — timer cleared on unmount
useEffect(() => {
  const timer = setTimeout(() => navigation.navigate("CreateMPIN"), 3000);
  return () => clearTimeout(timer);
}, [navigation]);

// ❌ Wrong — fires even if component unmounted, causes stale navigation
useEffect(() => {
  setTimeout(() => navigation.navigate("CreateMPIN"), 3000);
}, []);
```

For `Animated` sequences, store the composite animation and call `.stop()` in cleanup:

```ts
useEffect(() => {
  const anim = Animated.loop(Animated.timing(opacity, { toValue: 1, ... }));
  anim.start();
  return () => anim.stop();
}, []);
```

## Testing Standards

### Coverage Requirements

- Minimum **80% coverage** (statements, **branches**, functions, lines)
- Every feature hook has success, failure, and edge case tests
- All sagas have success, failure, and retry tests
- All reducers test every action
- All selectors have tests

### Test Code Quality

**Test files must follow the same quality standards as production code:**

- ✅ No unused variables (common issue: destructuring `rerender`, `waitFor` but not using them)
- ✅ No dead code or incomplete test cases
- ✅ All destructured test utilities must be used in the test body
- ✅ ESLint rules apply to test files — **test files are NOT exempt from linting**
- ✅ `.eslintrc.js` must NOT have `__tests__/` in `ignorePatterns`
- ✅ Run `npm run lint` on test files during development

**Common Test Code Issues:**

```typescript
// ❌ Wrong — rerender destructured but never used
const { getByTestId, rerender } = render(<Component />);
expect(getByTestId('button')).toBeTruthy();

// ✅ Correct — only destructure what you use
const { getByTestId } = render(<Component />);
expect(getByTestId('button')).toBeTruthy();
```

**TypeScript in Tests:**

- Use `jest.Mocked<typeof x>` NOT `jest.MockedFunction<typeof x>` (deprecated)
- Screen components require BOTH `navigation` AND `route` props:

```typescript
// ❌ Wrong — missing route, using 'as any'
<SplashScreen navigation={mockNav} route={{} as any} />;

// ✅ Correct — properly typed mock route
const mockRoute = {
  key: 'splash-test',
  name: ONBOARDING_ROUTES.SPLASH
} as SplashScreenProps['route'];
<SplashScreen navigation={mockNav} route={mockRoute} />;
```

- Hook tests that accept `ScreenProps` need BOTH properties in props object

### Branch Coverage

Statement coverage alone is insufficient — target **80% branch coverage** explicitly:

- Every conditional rendering path (`if (isLoading)`, `isFilled ? A : B`) needs a dedicated test
- For digit/PIN input components, test: 0 digits entered, partial fill, and full fill separately
- Test both `true` and `false` branches of every prop-driven conditional style

```ts
// ✅ Both branches covered
it("should render filled circle style when digit entered", () => {
  // branch: isFilled = true
});
it("should render empty circle style when no digit entered", () => {
  // branch: isFilled = false
});

// ❌ Only one branch — misses half the conditional logic
it("should render circles", () => {
  /* checks truthy only */
});
```

### Test Structure

```ts
describe("useAuthLogin", () => {
  it("should dispatch login action on submit", () => {
    /* ... */
  });
  it("should show error on invalid credentials", () => {
    /* ... */
  });
  it("should navigate to dashboard on success", () => {
    /* ... */
  });
});
```

**Mock Patterns:**

**Redux Mocks:**

```ts
const mockState: RootState = {
  auth: { status: "idle", token: null, error: null },
  dashboard: {
    /* all required slices */
  },
  // Must provide ALL state slices accessed by the hook under test
};

jest.mock("finvault/store", () => ({
  useAppSelector: jest.fn((selector) => selector(mockState)),
  useAppDispatch: jest.fn(() => mockDispatch),
}));
```

**feature module Mocks:**

Prefer mocking the entire feature module in test files that don't need the real implementation:

```ts
jest.mock("finvault/auth", () => ({
  useBiometric: jest.fn(() => ({
    authenticate: jest.fn(),
    isAvailable: true,
  })),
}));
```

**`jest.mock()` Factory Scope — No Outer Variable References:**

Factory functions passed to `jest.mock()` are hoisted to the top of the file by Babel. Variables declared in the outer test scope are **not in scope** when the factory executes, causing `ReferenceError: Cannot access '...' before initialization`.

```ts
// ❌ Wrong — mockReturnValue references outer scope, ReferenceError at runtime
const mockReturnValue = { token: "abc", status: "success" };
jest.mock("finvault/auth", () => ({
  useAuth: () => mockReturnValue, // ReferenceError: hoisted above declaration
}));

// ✅ Correct — inline values inside the factory
jest.mock("finvault/auth", () => ({
  useAuth: () => ({ token: "abc", status: "success" }),
}));

// ✅ Also correct — use require() inside the factory for real module access
jest.mock("finvault/auth", () => ({
  ...jest.requireActual("finvault/auth"),
  useAuth: jest.fn(),
}));
```

**Rule:** Mock factory functions must be self-contained — declare all values inline or use `jest.requireActual()`. Never reference variables from the outer module scope.

**`@types/node` for Security Audit / File-System Tests:**

Tests that use Node.js built-ins (`fs`, `path`) require `@types/node` installed as a dev dependency. This is common in security-audit and file-scanning tests.

```bash
npm install --save-dev @types/node
```

Add `"node"` to the `types` array in `tsconfig.base.json` if Node globals are needed across the project.

**Native Module Mocks:**

- Native module mocks live in `jest.setup.ts`
- Never mock native modules in individual test files

### TypeScript Configuration for Tests

**`@types/jest` must be installed** — without it, test globals (`describe`, `it`, `expect`, `jest`) are not recognised by the TypeScript compiler.

```bash
npm install --save-dev @types/jest
```

**`tsconfig.json` must NOT exclude test files.** Excluding `__tests__/` prevents:

- VS Code from resolving `finvault/*` path aliases inside test files
- The `typecheck` pipeline gate from catching real type errors in tests

```jsonc
// ❌ Wrong — test files excluded; real TS errors hidden from pipeline
{
  "exclude": ["node_modules", "jest.setup.ts", "**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"]
}

// ✅ Correct — only node_modules excluded; tests are type-checked too
{
  "exclude": ["node_modules"]
}
```

**`tsconfig.base.json` must declare `"types": ["jest"]`** so Jest globals are available in all included files:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "types": ["jest"],
    // ... other options
  },
}
```

### Test File Naming

- Test files must match source file name + `.test.ts` or `.test.tsx`
- Co-locate tests with source files when possible
- Example: `useAuth.ts` → `useAuth.test.ts`

### TypeScript Configuration for Tests

**`@types/jest` must be installed** — without it, test globals (`describe`, `it`, `expect`, `jest`) are not recognised by the TypeScript compiler.

```bash
npm install --save-dev @types/jest
```

**`tsconfig.json` must NOT exclude test files.** Excluding `__tests__/` prevents:

- VS Code from resolving `finvault/*` path aliases inside test files
- The `typecheck` pipeline gate from catching real type errors in tests

```jsonc
// ❌ Wrong — test files excluded; real TS errors hidden from pipeline
{
  "exclude": ["node_modules", "jest.setup.ts", "**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"]
}

// ✅ Correct — only node_modules excluded; tests are type-checked too
{
  "exclude": ["node_modules"]
}
```

**`tsconfig.base.json` must declare `"types": ["jest"]`** so Jest globals are available in all included files:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "types": ["jest"],
    // ... other options
  },
}
```
