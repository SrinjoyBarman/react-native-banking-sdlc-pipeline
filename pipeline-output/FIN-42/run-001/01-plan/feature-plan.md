# Feature Plan: FIN-42 — Dummy Login Screen

**Date**: 2026-07-17  
**Author**: sdlc-g1-feature-planner  
**Jira Ticket**: FIN-42  
**Run**: run-001  
**Gate**: SDLC_G1_PLAN — PASSED

---

## Summary

Implement the first screen of the FinVault Mobile authentication flow: a mobile-number-based OTP login screen with a Customer / Bank Staff role selector. This is a **POC/dummy** implementation — all API calls use mock responses; no real backend is integrated. The full mandatory API call chain (`Screen → hook → saga → service → ApiService (mock)`) is preserved for architectural correctness and future swap-out.

**Primary module:** `auth`  
**Secondary touches:** `store` (root reducer + saga), `core` (analytics event constants)  
**Navigation entry point:** `AuthNavigator` (new) wired into `App.tsx`

---

## User Stories (Dependency Order)

---

### US-1: Install Native Dependencies

**Module:** Project root (setup)  
**Layer:** Infrastructure  
**Complexity:** S

**Description:**  
As a developer, I need `react-native-svg` (to render SVG icon assets) and `react-native-get-random-values` (CSPRNG polyfill for secure OTP mock) installed and configured before any auth module code is written.

**Files to create/modify:**

- `package.json` — add `react-native-svg` and `react-native-get-random-values`
- `ios/Podfile` — `pod install` to link native modules
- `index.js` — import `react-native-get-random-values` at the top (polyfill must run before any crypto usage)

> **Note on test libraries:** Install `@testing-library/react-native`, `redux-saga-test-plan`, and `@types/jest` in US-9 when tests are being written, if not already present.

**Depends on:** none

**Acceptance criteria:**

- `import 'react-native-svg'` resolves without error in Metro
- `import 'react-native-get-random-values'` in `index.js` runs before any auth code
- `crypto.getRandomValues` is available globally in the JS runtime

**Satisfies REQ-IDs:** REQ-015

---

### US-2: Auth Redux Slice + State Types

**Module:** `auth`  
**Layer:** Data (Redux slice)  
**Complexity:** S

**Description:**  
As a developer, I want an `authSlice` that models the async lifecycle of `requestOtp` and `authenticate` actions so all auth state is managed centrally in Redux.

**Files to create:**

- `src/auth/store/slices/authSlice.ts`
- `src/auth/store/index.ts` (barrel — re-exports slice, selectors, saga)

**Slice shape:**

```ts
interface AuthState {
  otpStatus: "idle" | "loading" | "success" | "error";
  authStatus: "idle" | "loading" | "success" | "error";
  error: string | null;
  otpRequested: boolean; // true after first successful OTP dispatch — shows OTP field
}
```

**Actions exported:**

- `requestOtpStart` / `requestOtpSuccess` / `requestOtpFailure`
- `authenticateStart` / `authenticateSuccess` / `authenticateFailure`
- `resetAuthState` (clears sensitive in-flight state after successful auth — satisfies REQ-014)

> **Note:** Mobile number and OTP values are **never** stored in Redux state (REQ-014). They live only in the `useLoginScreen` hook's local `useRef`.

**Depends on:** US-1

**Acceptance criteria:**

- Reducer handles all action types with correct state transitions
- `resetAuthState` clears `error`, resets both statuses to `'idle'`, sets `otpRequested: false`
- No `any` types; state shape is `Readonly<AuthState>`

**Satisfies REQ-IDs:** REQ-005, REQ-006, REQ-007, REQ-009, REQ-014

---

### US-3: Auth Selectors

**Module:** `auth`  
**Layer:** Data (selectors)  
**Complexity:** S

**Description:**  
As a developer, I want named selector functions for all derived auth state so no component or hook uses inline `state =>` lambdas.

**Files to create:**

- `src/auth/store/selectors/authSelectors.ts`

**Selectors to export:**

```ts
selectOtpStatus(state: RootState): AuthState['otpStatus']
selectAuthStatus(state: RootState): AuthState['authStatus']
selectAuthError(state: RootState): string | null
selectOtpRequested(state: RootState): boolean
```

**Derived selectors (in the hook, not here):**

```ts
isOtpLoading = otpStatus === "idle" || otpStatus === "loading";
isAuthLoading = authStatus === "idle" || authStatus === "loading";
```

> The `idle` guard on the loading flag is enforced in `useLoginScreen` (US-7), not the selector, because the selector returns raw status.

**Depends on:** US-2

**Acceptance criteria:**

- All selectors are named exports from `authSelectors.ts`
- No inline `state =>` lambdas anywhere in components or hooks

**Satisfies REQ-IDs:** REQ-004, REQ-005, REQ-007

---

### US-4: Mock Auth Service (OTP + Authenticate)

**Module:** `auth`  
**Layer:** Service  
**Complexity:** S

**Description:**  
As a developer, I want `requestOtp()` and `authenticate()` service functions that call through `ApiService` (mock mode) so the mandatory API chain is honoured even in the POC.

**Files to create:**

- `src/auth/services/authService.ts`
- `src/auth/services/__mocks__/authService.ts` (Jest manual mock)

**Typed contracts:**

```ts
// Request types
interface RequestOtpRequest {
  mobileNumber: string;
  role: "customer" | "staff";
}
interface AuthenticateRequest {
  mobileNumber: string;
  otp: string;
  role: "customer" | "staff";
}

// Response types
interface RequestOtpResponse {
  success: boolean;
  maskedMobile: string;
}
interface AuthenticateResponse {
  success: boolean;
  token: string;
}
```

**OTP mock generation** (in `authService.ts`):

```ts
import "react-native-get-random-values";
const buf = new Uint32Array(1);
crypto.getRandomValues(buf);
const otp = String(buf[0] % 1_000_000).padStart(6, "0");
```

> `Math.random()` is forbidden per REQ-015 and the project security standards.

**`__mocks__/authService.ts`** returns resolved promises for both functions, exposing `jest.fn()` handles so tests can spy and override.

**Depends on:** US-1

**Acceptance criteria:**

- Both functions are typed with named request/response interfaces (no `any`)
- OTP generation uses `crypto.getRandomValues()` — zero `Math.random()` calls
- Manual mock returns resolved promises by default; Jest can override per test
- `getApiService()` is called from `authService.ts` (chain preserved, even if base URL is empty in POC)

**Satisfies REQ-IDs:** REQ-005, REQ-008, REQ-009, REQ-015

---

### US-5: Auth Saga + Root Store Wiring

**Module:** `auth`, `store`  
**Layer:** Async (Redux-Saga)  
**Complexity:** M

**Description:**  
As a developer, I want `watchRequestOtp` and `watchAuthenticate` saga watchers that orchestrate the async OTP and authentication flows, and I want the auth slice + saga registered in the root store.

**Files to create:**

- `src/auth/store/sagas/authSaga.ts`

**Files to modify:**

- `src/store/store.ts` — register `authReducer` under `auth` key; fork `authSaga` in `rootSaga`

**Saga structure:**

```
watchRequestOtp  → takeLatest(REQUEST_OTP)  → requestOtpWorker
watchAuthenticate → takeLatest(AUTHENTICATE) → authenticateWorker
```

**Worker behaviour:**

- Calls `authService.requestOtp()` / `authService.authenticate()`
- On success: dispatches `requestOtpSuccess` / `authenticateSuccess`
- On failure: dispatches `requestOtpFailure` / `authenticateFailure` with sanitised error message (no user data in error logs — REQ-014)
- `authenticateWorker` on success: dispatches `resetAuthState` then triggers navigation (via saga channel or action)

**Root store changes in `src/store/store.ts`:**

```ts
// Uncomment + import:
auth: authReducer;
// and fork(authSaga) in rootSaga
```

**Depends on:** US-2, US-3, US-4

**Acceptance criteria:**

- `takeLatest` used for both watchers (cancels in-flight duplicate requests)
- Error messages sanitised before dispatch — no mobile number or OTP in error payload
- Root store exports updated `RootState` that includes `auth` key
- `sagaMiddleware.run(rootSaga)` executes `authSaga` watcher

**Satisfies REQ-IDs:** REQ-005, REQ-006, REQ-008, REQ-009, REQ-014

---

### US-6: Analytics Event Constants

**Module:** `core`  
**Layer:** Constants / Observability  
**Complexity:** S

**Description:**  
As a developer, I want `SCREEN_EVENTS.LOGIN`, `ACTION_EVENTS.OTP_ATTEMPTED`, and `ACTION_EVENTS.LOGIN_ATTEMPTED` added to the analytics events file so analytics calls in the hook are type-safe and named.

**Files to create (if not present) / modify:**

- `src/core/analytics/events.ts` — add the three event constants

**Expected additions:**

```ts
export const SCREEN_EVENTS = {
  // ...existing events...
  LOGIN: "screen_login",
} as const;

export const ACTION_EVENTS = {
  // ...existing events...
  OTP_ATTEMPTED: "action_otp_attempted",
  LOGIN_ATTEMPTED: "action_login_attempted",
} as const;
```

> If `src/core/analytics/events.ts` does not yet exist, create it with the full `SCREEN_EVENTS` and `ACTION_EVENTS` constant objects.

**Depends on:** none (can be done in parallel with US-1)

**Acceptance criteria:**

- All three keys are present and exported
- No PII in event names (mobile number / OTP not included)
- Used via named constants — no magic strings in the hook

**Satisfies REQ-IDs:** REQ-010, REQ-011, REQ-012

---

### US-7: useLoginScreen Hook

**Module:** `auth`  
**Layer:** Hook (screen logic)  
**Complexity:** M

**Description:**  
As a developer, I want a `useLoginScreen` hook that encapsulates all screen logic — form state, validation, dispatch, analytics calls, and navigation — so the `LoginScreen` component is a pure rendering shell.

**Files to create:**

- `src/auth/hooks/useLoginScreen.ts`

**Hook responsibilities:**

- Local state: `mobileNumber` (useRef, not useState — never in Redux), `otp` (useRef), `selectedRole: 'customer' | 'staff'`
- Reads Redux state via named selectors from US-3
- Derives: `isGetOtpEnabled = mobileNumber.length === 10`, `isAuthenticateEnabled = otp.length > 0`
- Derives loading flags: `isOtpLoading = otpStatus === 'idle' || otpStatus === 'loading'`
- `handleGetOtp()`: fires `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)`, then dispatches `requestOtpStart`
- `handleAuthenticate()`: fires `analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)`, then dispatches `authenticateStart`
- `handleMobileChange(text)`: strips non-numeric, truncates to 10, stores in ref
- Screen view analytics: `useEffect(() => { analytics.screen(SCREEN_EVENTS.LOGIN); }, [])`
- On `authStatus === 'success'`: dispatches `resetAuthState()`, then calls `navigation.navigate('Dashboard')` (or placeholder route)
- Mobile number and OTP stored in `useRef` — never passed to navigation, never in Redux (REQ-014)

**Depends on:** US-2, US-3, US-5, US-6

**Acceptance criteria:**

- Zero logic in `LoginScreen.tsx` — all state and handlers come from this hook
- `isOtpLoading` uses the `'idle' || 'loading'` guard
- Mobile number ref cleared after successful auth; OTP ref cleared after successful auth
- Analytics called before dispatch in both handlers
- No `any` types

**Satisfies REQ-IDs:** REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-014

---

### US-8: LoginScreen Component, Styles, Navigation Wiring

**Module:** `auth`  
**Layer:** UI + Navigation  
**Complexity:** L

**Description:**  
As a user, I want to see and interact with the Login Screen exactly as designed so I can select my role, enter my mobile number, receive an OTP, and authenticate.

**Files to create:**

- `src/auth/screens/LoginScreen/LoginScreen.tsx`
- `src/auth/screens/LoginScreen/LoginScreen.styles.ts`
- `src/auth/screens/LoginScreen/LoginScreen.types.ts`
- `src/auth/screens/LoginScreen/index.ts`
- `src/auth/navigation/AuthNavigator.tsx`
- `src/auth/index.ts` (public barrel — exports `LoginScreen` and `AuthNavigator`)

**Files to modify:**

- `App.tsx` — replace `NewAppScreen` with `AuthNavigator` as the root navigator; install `@react-navigation/native` + `@react-navigation/native-stack` if not present

**Component layout (top → bottom):**

1. `Image` — full-width hero (source: `src/assets/images/hero-image.png`), height ~45% screen
2. Logo badge — `gen_ai_bank_gradient.svg` via `react-native-svg`, pill shape, positioned left-aligned over hero/content boundary
3. "Welcome" heading — bold 36sp, color from design tokens (near-black)
4. Subtitle — 16sp normal weight, secondary text color
5. Form card — white background, `borderRadius: 16`, elevation shadow, `16px` horizontal margin
   - Role selector row: two equal-width pressable items, Customer pre-selected, `AccountCircleFilled.svg` / `WorkFilled.svg` icons
   - Mobile number `TextInput`: outlined border, `PhoneIphoneFilled.svg` left icon, `keyboardType="numeric"`, `maxLength={10}`
   - GET OTP button: full width, 48px height, disabled/active states, loading spinner when `isOtpLoading`
   - OTP `TextInput`: conditionally rendered when `otpRequested === true`
   - AUTHENTICATE button: full width, 48px height, disabled/active states
   - Inline error message: rendered when `authError !== null`
6. Footer — copyright text + tappable "PRIVACY POLICY" link (opens placeholder WebView/modal)

**Style rules:**

- All colours from design tokens (no hardcoded hex except where token maps to design spec colours)
- Background: `#DCE8F7` (light blue tint) — add token `colors.backgroundLoginTint` to `core/theme`
- Gradient stops: `#1565C0` → `#B934A3` — add tokens `colors.gradientStart` / `colors.gradientEnd`

**`testID` and `accessibilityLabel` required on:**

- Customer toggle, Bank Staff toggle, mobile number input, OTP input, GET OTP button, AUTHENTICATE button, PRIVACY POLICY link

**Depends on:** US-7

**Acceptance criteria:**

- LoginScreen renders layout matching design spec
- Customer role selected by default
- OTP field hidden until `otpRequested === true`
- GET OTP disabled when mobile < 10 digits; blue when enabled
- AUTHENTICATE disabled when OTP empty; blue when entered
- Error message renders inline in card on failure
- `react-navigation` stack with `AuthNavigator` is the root navigator in `App.tsx`
- All interactive elements have `testID` and `accessibilityLabel`

**Satisfies REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, REQ-008, REQ-009, REQ-013, REQ-016

---

### US-9: Unit Tests

**Module:** `auth` (tests)  
**Layer:** Tests  
**Complexity:** M

**Description:**  
As a developer, I want unit tests for the auth slice, saga, and hook so the feature meets the 80% coverage threshold and all acceptance criteria are verifiable.

> **Library install:** If `@testing-library/react-native`, `redux-saga-test-plan`, or `@types/jest` are not already installed, add them to `devDependencies` at the start of this story.

**Files to create:**

- `src/auth/store/slices/__tests__/authSlice.test.ts`
- `src/auth/store/sagas/__tests__/authSaga.test.ts`
- `src/auth/hooks/__tests__/useLoginScreen.test.ts`
- `src/auth/services/__tests__/authService.test.ts`

**Test coverage targets:**

| File             | Tests                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authSlice`      | All action handlers, initial state, `resetAuthState`                                                                                                                 |
| `authSaga`       | OTP success path, OTP failure path, auth success path, auth failure path, saga cancellation                                                                          |
| `useLoginScreen` | OTP enable guard, auth enable guard, `handleGetOtp` dispatch + analytics, `handleAuthenticate` dispatch + analytics, `resetAuthState` on success, mobile ref cleared |
| `authService`    | Mocked response contracts, crypto usage verified (`Math.random` spy returns nothing)                                                                                 |

**Depends on:** US-2, US-3, US-4, US-5, US-7

**Acceptance criteria:**

- `npm test` passes with ≥ 80% branch coverage across auth module
- Saga tests use `redux-saga-test-plan` `expectSaga`
- Hook tests use `@testing-library/react-native` `renderHook` with a test store
- No `Math.random` calls — verified by spy assertion in service test

**Satisfies REQ-IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016

---

## Implementation Sequence

```
US-1 (Install deps)
  │
  ├─► US-2 (authSlice)      ──► US-3 (selectors)
  │                                 │
  ├─► US-4 (authService)           │
  │         │                      │
  │         └──────────────────────┼─► US-5 (authSaga + root wiring)
  │                                │            │
  └─► US-6 (analytics constants)  │            │
                                   │            │
                                   └────────────┴─► US-7 (useLoginScreen hook)
                                                           │
                                                           └─► US-8 (LoginScreen UI + nav)
                                                                       │
                                                                       └─► US-9 (Unit tests)
```

US-1 and US-6 can be executed in parallel.  
US-2 and US-4 can be executed in parallel after US-1.  
US-3 and US-5 must wait for US-2 and US-4 respectively.

---

## Risks & Mitigations

| Risk                                                | Likelihood | Impact | Mitigation                                                                                                                                                       |
| --------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-native-svg` pod link fails on iOS            | Medium     | High   | Run `cd ios && pod install` after `npm install`; check RN version compatibility                                                                                  |
| `react-navigation` not yet installed                | High       | High   | Install `@react-navigation/native`, `@react-navigation/native-stack`, and peer deps (`react-native-screens`, `react-native-safe-area-context`) in US-8           |
| `crypto.getRandomValues` not polyfilled at startup  | Medium     | High   | Ensure `import 'react-native-get-random-values'` is the **first** import in `index.js` (before React import)                                                     |
| Design token gaps (gradient stops, background tint) | Low        | Medium | Add `gradientStart`, `gradientEnd`, `backgroundLoginTint` to `src/core/theme/colors.ts` in US-8                                                                  |
| `hero-image.png` asset path mismatch                | Low        | Medium | Design spec uses `src/assets/images/hero-image.png`; problem spec mentions `hero-login.png` — use `hero-image.png` (confirmed present per current project state) |
| Dashboard route does not exist post-auth            | Medium     | Low    | Navigate to a `DashboardPlaceholder` screen or log a console warning in POC; create stub route in `App.tsx`                                                      |
| Test library gaps at US-9                           | Medium     | Medium | Install `@testing-library/react-native` and `redux-saga-test-plan` at the start of US-9 if not present                                                           |
