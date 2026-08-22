# Problem Spec: FIN-42 — Mobile: Test MCP Integration: Dummy Login

**Date**: 2026-07-17  
**Author**: sdlc-g0-requirements-analyst  
**Jira Ticket**: FIN-42  
**Run**: run-001

---

## Overview

Create a login screen for the FinVault Mobile app as the entry point of the authentication flow. This is a **POC/demo ("Dummy Login")** feature — it uses a simulated/mock OTP backend (no real API integration). The screen follows the design spec extracted from the "Mobile /customer" section of the prototype and implements a mobile-number-based OTP login with a Customer / Bank Staff role selector.

**task_type**: `UI_SCREEN`  
**design_artifact_status**: `PROVIDED`  
**env_example_missing**: _not checked — non-blocking advisory_

---

## Affected Modules

- `auth` — Primary module: new login screen, Redux slice, saga, mock service, hook
- `shared` — Shared UI atoms/molecules may be consumed (Button, Input primitives)
- `core` — Analytics event constants must be extended with login/OTP event keys
- `store` — Root saga and root reducer must register the new `auth` slice and saga

---

## Sub-Problems

1. Render the full login screen layout per design spec (hero image, logo badge, heading, subtitle, form card, footer)
2. Implement Customer / Bank Staff role selector (2-state toggle, Customer pre-selected)
3. Implement mobile number input with phone icon, 10-digit numeric-only validation
4. Implement GET OTP button with activation guard (enabled only at exactly 10 digits)
5. Implement OTP input field (appears after GET OTP is tapped)
6. Implement AUTHENTICATE button with activation guard (enabled only when OTP is present)
7. Wire Redux slice + saga + mock service for OTP request and authentication
8. Implement screen-level loading and error states
9. Add hero image background and GEN AI BANK gradient logo badge (pill, blue-to-purple gradient)
10. Add footer with copyright text and PRIVACY POLICY link (placeholder)
11. Instrument analytics: screen view event + key action events

---

## Constraints

- **POC only** — use mock/simulated service; no real backend calls
- Mandatory API call chain must be preserved: `Screen → hook → saga → service → ApiService (mock)`
- Loading state must include `'idle'` check: `isLoading = status === 'idle' || status === 'loading'`
- No `any` types — use `unknown` with type guards where needed
- All colours and spacing from design tokens only (`finvault/core`) — no hardcoded values
- No sensitive data (mobile number, OTP) passed through navigation params
- No `Math.random()` for OTP mock generation — use `crypto.getRandomValues()` via `react-native-get-random-values`
- All interactive elements must carry `testID` and `accessibilityLabel`
- Component syntax: `React.FC<Props>` arrow functions only

---

## Edge Cases

- User enters non-numeric characters → input ignores them (keyboardType `numeric` + input filter)
- User pastes a string longer than 10 digits → truncated to 10 digits
- User submits with fewer than 10 digits → GET OTP button remains disabled; no action dispatched
- Mock OTP service call fails → error message displayed inside form card; AUTHENTICATE button remains disabled
- User taps Bank Staff toggle → same OTP flow applies; `role: 'staff'` included in mock payload
- User navigates back while OTP request is in-flight → saga cancelled; loading state reset to `'idle'`
- User taps GET OTP a second time (re-sends OTP) → previous OTP input cleared, new OTP simulated
- OTP entered is incorrect (wrong mock value) → AUTHENTICATE fails with inline error message

---

## Assumptions

- **Mock OTP value**: A fixed value (e.g., `"123456"`) is accepted in the dummy implementation; any value may be accepted for pure POC simplicity — to be confirmed with team
- **Post-auth navigation**: Successful authentication navigates to a Dashboard placeholder or the existing dashboard screen
- **PRIVACY POLICY link**: Opens a `WebView` or modal with a placeholder URL (acceptable for POC)
- **Hero image asset**: `assets/images/hero-login.png` (businessmen handshake) is available or must be added to the assets bundle
- **Gradient logo**: Blue-to-purple linear gradient is achievable with `react-native-linear-gradient` (already in project dependencies) or `expo-linear-gradient`
- **Design tokens** for gradient stops must be added to `core/theme` if not already present
- **Phone icon**: Available from the existing icon set (e.g., `react-native-vector-icons` or SVG asset)

---

## Acceptance Criteria

- [ ] REQ-001: Given the app is launched, when the LoginScreen mounts, then the hero image background, GEN AI BANK gradient badge, "Welcome" heading, and subtitle are all visible
- [ ] REQ-002: Given the LoginScreen is displayed, when the user views the form card, then two toggle buttons ("Customer" and "Bank Staff") are rendered with icons, with "Customer" selected by default
- [ ] REQ-003: Given the form card is visible, when the user taps the mobile number input, then only numeric input is accepted, the field is labelled "\* Mobile", shows a phone icon, and enforces a maximum of 10 digits
- [ ] REQ-004: Given the mobile number input contains fewer than 10 digits, then the GET OTP button is visually disabled and non-interactive
- [ ] REQ-005: Given exactly 10 digits are entered, when the user taps GET OTP, then the mock OTP saga is triggered and a loading indicator is shown on the button
- [ ] REQ-006: Given the OTP request succeeds, when the saga completes, then an OTP input field becomes visible below the GET OTP button
- [ ] REQ-007: Given the OTP input field is visible but empty, then the AUTHENTICATE button is visually disabled and non-interactive
- [ ] REQ-008: Given a valid OTP is entered, when the user taps AUTHENTICATE, then the mock authentication saga is triggered; on success, the user is navigated to the next screen (Dashboard or placeholder)
- [ ] REQ-009: Given the mock service returns a failure, when the saga catches the error, then an inline error message is shown inside the form card and no navigation occurs
- [ ] REQ-010: Given the LoginScreen mounts, then `analytics.screen(SCREEN_EVENTS.LOGIN)` is fired exactly once
- [ ] REQ-011: Given the user taps GET OTP, then `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)` is fired before the saga dispatch
- [ ] REQ-012: Given the user taps AUTHENTICATE, then `analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)` is fired before the saga dispatch
- [ ] REQ-013: Given any interactive element (toggle buttons, inputs, GET OTP, AUTHENTICATE, PRIVACY POLICY), then each has a unique `testID` and a descriptive `accessibilityLabel`
- [ ] REQ-014: Given a successful login, when navigating to the next screen, then the mobile number and OTP are NOT present in navigation params or persisted Redux state
- [ ] REQ-015: Given the mock OTP is generated, when `crypto.getRandomValues()` is used via the `react-native-get-random-values` polyfill, then no `Math.random()` call appears in the auth module
- [ ] REQ-016: Given the screen is fully rendered, then the footer displays copyright text and a tappable "PRIVACY POLICY" link

---

## NFR Catalog

| NFR Category      | Requirement                     | Measurable Criterion                                                                              |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Performance**   | Screen load time                | Cold start ≤ 2 s; Time-to-Interactive ≤ 1.5 s on mid-tier device                                  |
| **Reliability**   | OTP mock failure handling       | Saga handles rejection; error state shown; no crash; retry capped at 1 (POC)                      |
| **Security**      | No sensitive data in state/logs | Mobile number and OTP absent from Redux DevTools, console logs, nav params                        |
| **Security**      | Cryptographically secure mock   | OTP generation uses `crypto.getRandomValues()` — `Math.random()` is forbidden                     |
| **Accessibility** | Touch target size               | All buttons ≥ 44 × 44 pt; colour contrast ratio ≥ 4.5:1 (WCAG 2.1 AA)                             |
| **Observability** | Analytics coverage              | `SCREEN_EVENTS.LOGIN`, `ACTION_EVENTS.OTP_ATTEMPTED`, `ACTION_EVENTS.LOGIN_ATTEMPTED` all present |

---

## Files to Create / Modify

### New Files

| File                                                 | Purpose                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `src/auth/screens/LoginScreen/LoginScreen.tsx`       | Screen component (logic-free, delegates to hook)            |
| `src/auth/screens/LoginScreen/LoginScreen.styles.ts` | StyleSheet with design tokens only                          |
| `src/auth/screens/LoginScreen/LoginScreen.types.ts`  | Props and local type definitions                            |
| `src/auth/screens/LoginScreen/index.ts`              | Barrel export                                               |
| `src/auth/hooks/useLoginScreen.ts`                   | All screen logic, form state, dispatch, navigation          |
| `src/auth/store/slices/authSlice.ts`                 | Redux slice: OTP request + authentication async states      |
| `src/auth/store/sagas/authSaga.ts`                   | Redux-Saga watchers: `watchRequestOtp`, `watchAuthenticate` |
| `src/auth/store/selectors/authSelectors.ts`          | Named selectors: `selectAuthStatus`, `selectAuthError`      |
| `src/auth/services/authService.ts`                   | Service functions: `requestOtp()`, `authenticate()`         |
| `src/auth/services/__mocks__/authService.ts`         | Jest manual mock returning resolved promises                |
| `assets/images/hero-login.png`                       | Hero background image (businessmen handshake)               |

### Modified Files

| File                                    | Change                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/auth/index.ts`                     | Export `LoginScreen` from public barrel                                                   |
| `src/store/rootSaga.ts`                 | Register `authSaga` watcher                                                               |
| `src/store/rootReducer.ts`              | Register `authReducer` under `auth` key                                                   |
| `src/core/analytics/events.ts`          | Add `SCREEN_EVENTS.LOGIN`, `ACTION_EVENTS.OTP_ATTEMPTED`, `ACTION_EVENTS.LOGIN_ATTEMPTED` |
| `src/auth/navigation/AuthNavigator.tsx` | Register `LoginScreen` as the initial route                                               |

---

## Dependencies

- `react-native-get-random-values` — CSPRNG polyfill for secure OTP mock generation (verify installed; add if missing)
- `react-native-linear-gradient` — Blue-to-purple gradient for GEN AI BANK logo badge
- `finvault/core` — `ApiService`, `theme` tokens, `analytics` event constants
- `finvault/shared` — Reusable `Button`, `Input` atoms if they exist; otherwise create in `src/auth/` temporarily and promote to `shared` later
- Auth navigation stack — `LoginScreen` must be the initial route in `AuthNavigator`
- Hero image asset — must be present in `assets/images/` before implementation
