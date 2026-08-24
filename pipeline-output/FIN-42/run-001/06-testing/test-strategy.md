# Test Strategy: FIN-42 — LoginScreen (Customer/Bank Staff selector, mobile OTP flow)

**Date**: 2026-07-17  
**Author**: sdlc-g4-test-planner  
**Ticket**: FIN-42

---

## Coverage Targets

| Metric     | Target |
| ---------- | ------ |
| Statements | ≥ 80%  |
| Branches   | ≥ 80%  |
| Functions  | ≥ 80%  |
| Lines      | ≥ 80%  |

---

## Acceptance Criterion → Test Case Mapping

| REQ     | Criterion summary                                      | Test cases             |
| ------- | ------------------------------------------------------ | ---------------------- |
| REQ-001 | Screen renders hero image, badge, heading, subtitle    | TC-001                 |
| REQ-002 | Selector shows both options; Customer default          | TC-002, TC-003         |
| REQ-003 | Mobile input: numeric-only, max 10 digits              | TC-004, TC-005, TC-006 |
| REQ-004 | GET OTP disabled when mobile < 10 digits               | TC-007, TC-008         |
| REQ-005 | GET OTP enabled + dispatches saga at exactly 10 digits | TC-009, TC-010         |
| REQ-006 | OTP field appears after OTP request succeeds           | TC-011, TC-012         |
| REQ-007 | AUTHENTICATE disabled when OTP empty/incomplete        | TC-013, TC-014         |
| REQ-008 | AUTHENTICATE dispatches saga; clears state on success  | TC-015, TC-016         |
| REQ-009 | Error message shown on service failure                 | TC-017, TC-018, TC-019 |
| REQ-010 | Screen view analytics fires on mount                   | TC-020                 |
| REQ-011 | OTP analytics fires before saga dispatch               | TC-021                 |
| REQ-012 | Login analytics fires before saga dispatch             | TC-022                 |
| REQ-013 | testID + accessibilityLabel on interactive elements    | TC-023                 |
| REQ-014 | Mobile + OTP not in nav params or Redux state          | TC-024, TC-025         |
| REQ-015 | No Math.random() — polyfill imported in saga           | TC-026                 |

---

## Test Cases

### TC-001: LoginScreen renders required static UI elements

- **Type**: Integration
- **File**: `src/auth/screens/LoginScreen/__tests__/LoginScreen.test.tsx`
- **Criterion**: REQ-001
- **Mocks**: `finvault/store` (useAppDispatch, useAppSelector), `finvault/core` (SCREEN_EVENTS, ACTION_EVENTS), `../../store` (action creators + selectors), `react-native-get-random-values`
- **Scenario**: Render `<LoginScreen />` with a test store in idle state. Assert the component tree contains the hero image (`testID="login-hero-image"`), the GEN AI BANK badge (`testID="login-badge"`), the Welcome heading text, and the subtitle text. Fails if any element is absent.

---

### TC-002: Selector renders both Customer and Bank Staff options

- **Type**: Integration
- **File**: `src/auth/screens/LoginScreen/__tests__/LoginScreen.test.tsx`
- **Criterion**: REQ-002
- **Mocks**: Same as TC-001
- **Scenario**: Render `<LoginScreen />`. Query for `testID="user-type-customer"` and `testID="user-type-staff"`. Both must be present in the rendered output.

---

### TC-003: Customer user type is selected by default

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-002
- **Mocks**: `finvault/store`, `finvault/core`, `../../store`, `react-native-get-random-values`
- **Scenario**: Mount the hook without any interactions. Assert `result.selectedUserType === 'customer'`. Already partially covered — extend to assert `'staff'` is NOT selected.

---

### TC-004: handleMobileChange strips non-numeric characters

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-003
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('abc123def456')`. Assert `mobileDisplay === '123456'` (only digits retained).

---

### TC-005: handleMobileChange enforces maximum of 10 digits

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-003
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('12345678901234')`. Assert `mobileDisplay.length === 10` and `mobileDisplay === '1234567890'`.

---

### TC-006: handleMobileChange accepts exactly 10 numeric digits unchanged

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-003
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('9876543210')`. Assert `mobileDisplay === '9876543210'`.

---

### TC-007: isGetOtpEnabled is false when mobile has fewer than 10 digits

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-004
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('123456789')` (9 digits). Assert `isGetOtpEnabled === false`. Also test 0 digits and 5 digits as edge sub-cases.

---

### TC-008: handleGetOtp does NOT dispatch when mobile < 10 digits

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-004
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('12345')` then `handleGetOtp()`. Assert `mockDispatch` was NOT called.

---

### TC-009: isGetOtpEnabled is true when mobile has exactly 10 digits

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-005
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('1234567890')`. Assert `isGetOtpEnabled === true`.

---

### TC-010: handleGetOtp dispatches requestOtpStart with mobile and userType

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-005
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('1234567890')` then `handleGetOtp()`. Assert `mockDispatch` called once with `{ type: 'auth/requestOtpStart', payload: { mobileNumber: '1234567890', userType: 'customer' } }`.

---

### TC-011: authReducer sets otpRequested=true on REQUEST_OTP_SUCCESS

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSlice.test.ts`
- **Criterion**: REQ-006
- **Mocks**: None (pure reducer)
- **Scenario**: Apply `requestOtpSuccess()` to an idle state. Assert resulting state has `otpRequested: true` and `otpStatus: 'success'`.

---

### TC-012: otpRequested selector returns true after OTP success in hook

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-006
- **Mocks**: Same as TC-003 — override `mockAuthState.otpRequested = true` and `mockAuthState.otpStatus = 'success'`
- **Scenario**: Mount the hook with `otpRequested: true`. Assert `result.otpRequested === true`, confirming the OTP field conditional renders.

---

### TC-013: isAuthEnabled is false when otpDisplay is empty

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-007
- **Mocks**: Same as TC-003
- **Scenario**: Mount hook without calling `handleOtpChange`. Assert `isAuthEnabled === false`.

---

### TC-014: isAuthEnabled is false when OTP has fewer than 6 digits

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-007
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleOtpChange('12345')` (5 digits). Assert `isAuthEnabled === false`.

---

### TC-015: handleAuthenticate dispatches authenticateStart with correct payload

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-008
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('1234567890')`, `handleOtpChange('123456')`, then `handleAuthenticate()`. Assert `mockDispatch` called with `{ type: 'auth/authenticateStart', payload: { mobileNumber: '1234567890', otp: '123456', userType: 'customer' } }`.

---

### TC-016: authStatus=success causes hook to dispatch resetAuthState and clear local state

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-008
- **Mocks**: Same as TC-003 — transition `mockAuthState.authStatus` to `'success'` via re-render
- **Scenario**: Mount hook with `authStatus: 'success'`. Assert `mockDispatch` called with `{ type: 'auth/resetAuthState' }`. Assert `mobileDisplay === ''` and `otpDisplay === ''` after the effect runs.

---

### TC-017: authReducer records error message on REQUEST_OTP_FAILURE

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSlice.test.ts`
- **Criterion**: REQ-009
- **Mocks**: None (pure reducer)
- **Scenario**: Apply `requestOtpFailure('Network error')` to idle state. Assert `state.otpStatus === 'error'` and `state.error === 'Network error'`.

---

### TC-018: authReducer records error message on AUTHENTICATE_FAILURE

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSlice.test.ts`
- **Criterion**: REQ-009
- **Mocks**: None (pure reducer)
- **Scenario**: Apply `authenticateFailure('Invalid OTP')` to idle state. Assert `state.authStatus === 'error'` and `state.error === 'Invalid OTP'`.

---

### TC-019: error selector value is surfaced through hook

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-009
- **Mocks**: Same as TC-003 — set `mockAuthState.error = 'Invalid OTP'`
- **Scenario**: Mount hook with `error: 'Invalid OTP'`. Assert `result.error === 'Invalid OTP'`.

---

### TC-020: Screen view analytics fires once on mount

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-010
- **Mocks**: Same as TC-003 — spy on `analytics.screen` via module mock of `console.log` or inject a jest.fn via the local `analytics` object
- **Scenario**: Mount hook. Assert that `analytics.screen` was called exactly once with `SCREEN_EVENTS.LOGIN` (`'login_screen_viewed'`). Re-render without unmounting and assert it is still called only once (no duplicate fires).

---

### TC-021: OTP analytics fires before requestOtpStart is dispatched

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-011
- **Mocks**: Same as TC-003 — capture call order of `analytics.track` and `mockDispatch`
- **Scenario**: Call `handleMobileChange('1234567890')` then `handleGetOtp()`. Use `jest.fn()` call-order tracking to assert `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)` is invoked before `mockDispatch`. Assert `analytics.track` received `'otp_requested'`.

---

### TC-022: Login analytics fires before authenticateStart is dispatched

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-012
- **Mocks**: Same as TC-003 — capture call order
- **Scenario**: Call `handleMobileChange('1234567890')`, `handleOtpChange('123456')`, then `handleAuthenticate()`. Assert `analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)` is invoked before `mockDispatch`. Assert `analytics.track` received `'login_attempted'`.

---

### TC-023: All interactive elements have testID and accessibilityLabel

- **Type**: Integration
- **File**: `src/auth/screens/LoginScreen/__tests__/LoginScreen.test.tsx`
- **Criterion**: REQ-013
- **Mocks**: Same as TC-001
- **Scenario**: Render `<LoginScreen />`. For each interactive/pressable element — user type selector buttons, mobile number input, GET OTP button, OTP input (render with `otpRequested: true`), and AUTHENTICATE button — assert both `testID` and `accessibilityLabel` props are present and non-empty.

---

### TC-024: Mobile number and OTP are stored in useRef, not dispatched to Redux as standalone state

- **Type**: Unit
- **File**: `src/auth/screens/__tests__/useLoginScreen.test.ts`
- **Criterion**: REQ-014
- **Mocks**: Same as TC-003
- **Scenario**: Call `handleMobileChange('1234567890')` and `handleOtpChange('123456')`. Inspect all `mockDispatch` calls. Assert that no dispatched action payload contains a top-level `mobileNumber` or `otp` field **outside** of `requestOtpStart` or `authenticateStart` (i.e., no standalone "storeMobile" or "storeOtp" action is dispatched). Also assert `mobileDisplay` and `otpDisplay` are local display values only.

---

### TC-025: authSlice state shape does not contain mobileNumber or otp fields

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSlice.test.ts`
- **Criterion**: REQ-014
- **Mocks**: None (pure reducer)
- **Scenario**: After applying `requestOtpStart({ mobileNumber: '1234567890', userType: 'customer' })` and then `authenticateStart({ mobileNumber: '1234567890', otp: '123456', userType: 'customer' })`, inspect the resulting state object. Assert it does NOT contain a `mobileNumber` key or `otp` key — confirming sensitive data is not persisted in the Redux store.

---

### TC-026: react-native-get-random-values polyfill is imported in authSaga

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSaga.test.ts`
- **Criterion**: REQ-015
- **Mocks**: `react-native-get-random-values` (mock as `{}` to prevent native crash), `../services/authService`
- **Scenario**: Import `authSaga` module. Assert the module loads without error and the `react-native-get-random-values` mock is called (module was required). As a complementary static check, assert that the source file `src/auth/store/authSaga.ts` does **not** contain the string `Math.random` — this can be verified in a separate lint/audit step documented here.

---

## Additional Saga Tests (REQ-005, REQ-008, REQ-009 depth)

### TC-027: requestOtpWorker puts requestOtpSuccess on service success

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSaga.test.ts`
- **Criterion**: REQ-005, REQ-009
- **Mocks**: `authService.requestOtp` stubbed to resolve
- **Scenario**: Use `redux-saga-test-plan` (or manual generator stepping) to run `requestOtpWorker`. Assert `call(requestOtp, ...)` is yielded, then `put(requestOtpSuccess())`.

---

### TC-028: requestOtpWorker puts requestOtpFailure with error message on service throw

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSaga.test.ts`
- **Criterion**: REQ-009
- **Mocks**: `authService.requestOtp` throws `new Error('Network error')`
- **Scenario**: Step the generator past the call. Inject the thrown error. Assert `put(requestOtpFailure('Network error'))` is yielded.

---

### TC-029: authenticateWorker puts authenticateSuccess on service success

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSaga.test.ts`
- **Criterion**: REQ-008
- **Mocks**: `authService.authenticate` stubbed to resolve
- **Scenario**: Step through `authenticateWorker`. Assert `call(authenticate, ...)` is yielded, then `put(authenticateSuccess())`.

---

### TC-030: authenticateWorker puts authenticateFailure on service throw

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSaga.test.ts`
- **Criterion**: REQ-009
- **Mocks**: `authService.authenticate` throws `new Error('Authentication failed')`
- **Scenario**: Inject error. Assert `put(authenticateFailure('Authentication failed'))` is yielded.

---

## Selector Unit Tests

### TC-031: selectOtpStatus, selectAuthStatus, selectAuthError, selectOtpRequested return correct slice values

- **Type**: Unit
- **File**: `src/auth/store/__tests__/authSelectors.test.ts`
- **Criterion**: REQ-006, REQ-009
- **Mocks**: None (pure functions)
- **Scenario**: Construct a mock `RootState` with a known `auth` slice. Assert each selector returns the expected field value. Also assert the safe fallback — when `state.auth` is `undefined`, selectors return the `initialState` defaults (idle statuses, null error, false otpRequested).

---

## Service Unit Tests

### TC-032: requestOtp resolves with success response

- **Type**: Unit
- **File**: `src/auth/services/__tests__/authService.test.ts`
- **Criterion**: REQ-005, REQ-009
- **Mocks**: `jest.useFakeTimers()` to skip the 500 ms delay
- **Scenario**: Call `requestOtp({ mobileNumber: '1234567890', userType: 'customer' })`. Advance timers. Assert response is `{ success: true, message: 'OTP sent successfully' }`.

---

### TC-033: authenticate resolves with token for valid 6-digit OTP

- **Type**: Unit
- **File**: `src/auth/services/__tests__/authService.test.ts`
- **Criterion**: REQ-008
- **Mocks**: `jest.useFakeTimers()`
- **Scenario**: Call `authenticate({ mobileNumber: '1234567890', otp: '123456', userType: 'customer' })`. Advance timers. Assert response contains `success: true` and a non-empty `token`.

---

### TC-034: authenticate throws for OTP shorter than 6 digits

- **Type**: Unit
- **File**: `src/auth/services/__tests__/authService.test.ts`
- **Criterion**: REQ-009
- **Mocks**: `jest.useFakeTimers()`
- **Scenario**: Call `authenticate({ ..., otp: '12345' })`. Advance timers. Assert the promise rejects with `Error('Invalid OTP. Please enter a 6-digit OTP.')`.

---

## Mock Requirements Summary

| Module                           | Mock strategy                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `react-native-get-random-values` | `jest.mock('react-native-get-random-values', () => {})` — prevents native crash; confirms polyfill import is present |
| `finvault/store`                 | `jest.mock` — returns `mockDispatch` fn and a `useAppSelector` that reads from a mutable `mockAuthState` object      |
| `finvault/core`                  | `jest.mock` — returns constant `SCREEN_EVENTS` and `ACTION_EVENTS` objects                                           |
| `../../store` (auth barrel)      | `jest.mock` — manual action creators + selector functions that read from `mockAuthState`                             |
| `../services/authService`        | `jest.mock` in saga tests — `requestOtp` and `authenticate` are `jest.fn()` stubs                                    |
| `console.log` (analytics shim)   | Spy via `jest.spyOn(console, 'log')` to capture analytics calls in hook tests                                        |
| `react-test-renderer` / `act`    | Used directly (no mock) for hook mounting in integration tests                                                       |

---

## Test File Inventory

| Test file                                                     | New / Extend | Test cases covered                       |
| ------------------------------------------------------------- | ------------ | ---------------------------------------- |
| `src/auth/screens/__tests__/useLoginScreen.test.ts`           | Extend       | TC-003 – TC-016, TC-019 – TC-022, TC-024 |
| `src/auth/screens/LoginScreen/__tests__/LoginScreen.test.tsx` | New          | TC-001, TC-002, TC-023                   |
| `src/auth/store/__tests__/authSlice.test.ts`                  | New          | TC-011, TC-017, TC-018, TC-025           |
| `src/auth/store/__tests__/authSaga.test.ts`                   | New          | TC-026 – TC-030                          |
| `src/auth/store/__tests__/authSelectors.test.ts`              | New          | TC-031                                   |
| `src/auth/services/__tests__/authService.test.ts`             | New          | TC-032 – TC-034                          |

---

## Coverage Target per File

| Source file                                      | Target |
| ------------------------------------------------ | ------ |
| `src/auth/screens/LoginScreen/useLoginScreen.ts` | ≥ 90%  |
| `src/auth/store/slices/authSlice.ts`             | ≥ 90%  |
| `src/auth/store/authSaga.ts`                     | ≥ 85%  |
| `src/auth/store/authSelectors.ts`                | 100%   |
| `src/auth/services/authService.ts`               | ≥ 80%  |

---

## Security Notes

- **REQ-014 / REQ-015** are security-critical requirements and must be treated as **blocking** (`🔴 Must fix`) during review.
- Mobile number and OTP must never appear in serialised Redux state — confirmed by TC-024 and TC-025.
- `Math.random()` must not appear in any auth module file — confirmed by TC-026 static audit step.
- Sensitive values must not be passed via navigation params — no navigation param test is needed for this screen since `useLoginScreen` uses `useRef` exclusively for sensitive values.
