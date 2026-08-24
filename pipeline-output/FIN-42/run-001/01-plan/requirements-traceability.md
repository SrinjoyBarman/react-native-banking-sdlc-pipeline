# Requirements Traceability Matrix — FIN-42

**Date**: 2026-07-17  
**Feature**: Dummy Login Screen  
**Run**: run-001

---

| REQ-ID  | Acceptance Criterion (summary)                                                              | User Story                                                                         | Test Hint                                                                              |
| ------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| REQ-001 | Hero image, gradient badge, "Welcome" heading, and subtitle all visible on mount            | US-8 (LoginScreen UI)                                                              | render: `LoginScreen` — snapshot + getByTestId hero/badge/heading                      |
| REQ-002 | Two role toggle buttons rendered; Customer pre-selected by default                          | US-8 (LoginScreen UI)                                                              | render: Customer toggle has active border; BankStaff has inactive                      |
| REQ-003 | Mobile input accepts only numeric, labelled "\* Mobile", shows phone icon, max 10 digits    | US-7 (useLoginScreen hook), US-8 (UI)                                              | hook: `handleMobileChange` strips non-numeric, truncates to 10                         |
| REQ-004 | GET OTP button disabled when mobile < 10 digits                                             | US-3 (selectors), US-7 (hook)                                                      | hook: `isGetOtpEnabled` false when `mobileNumber.length < 10`                          |
| REQ-005 | GET OTP triggers mock OTP saga; loading indicator shown                                     | US-2 (slice), US-4 (service), US-5 (saga), US-7 (hook)                             | saga: `expectSaga(watchRequestOtp)` dispatches success/failure                         |
| REQ-006 | OTP field becomes visible after successful OTP saga                                         | US-2 (slice: `otpRequested`), US-7 (hook), US-8 (UI)                               | slice: `requestOtpSuccess` sets `otpRequested: true`                                   |
| REQ-007 | AUTHENTICATE button disabled when OTP field is empty                                        | US-3 (selectors), US-7 (hook)                                                      | hook: `isAuthenticateEnabled` false when `otp.length === 0`                            |
| REQ-008 | AUTHENTICATE triggers auth saga; success navigates to next screen                           | US-5 (saga), US-7 (hook)                                                           | saga: `authenticateWorker` calls navigation on success; hook: navigate called          |
| REQ-009 | Saga failure shows inline error in form card; no navigation                                 | US-2 (slice), US-5 (saga), US-7 (hook), US-8 (UI)                                  | saga: failure path dispatches error; render: error text visible                        |
| REQ-010 | `analytics.screen(SCREEN_EVENTS.LOGIN)` fired once on mount                                 | US-6 (event constants), US-7 (hook)                                                | hook: `useEffect` spy — analytics.screen called once                                   |
| REQ-011 | `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)` fired before saga dispatch on GET OTP tap    | US-6 (event constants), US-7 (hook)                                                | hook: analytics.track called before dispatch in `handleGetOtp`                         |
| REQ-012 | `analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)` fired before saga dispatch on AUTHENTICATE | US-6 (event constants), US-7 (hook)                                                | hook: analytics.track called before dispatch in `handleAuthenticate`                   |
| REQ-013 | All interactive elements have unique `testID` and descriptive `accessibilityLabel`          | US-8 (LoginScreen UI)                                                              | render: assert `testID` + `accessibilityLabel` on each element                         |
| REQ-014 | Mobile number and OTP absent from navigation params and persisted Redux state after auth    | US-2 (slice: no mobile/OTP fields), US-5 (sanitised errors), US-7 (useRef storage) | hook: navigation called with no sensitive params; slice: state has no mobile/OTP keys  |
| REQ-015 | OTP generated via `crypto.getRandomValues()`; no `Math.random()` in auth module             | US-1 (polyfill install), US-4 (service)                                            | service test: spy confirms `Math.random` never called; `crypto.getRandomValues` called |
| REQ-016 | Footer shows copyright text and tappable "PRIVACY POLICY" link                              | US-8 (LoginScreen UI)                                                              | render: `getByTestId('privacy-policy-link')` is pressable                              |

---

## Coverage Summary

All 16 REQ-IDs from `problem-spec.md` are traced to at least one user story. No untraced requirements.

| User Story | REQ-IDs Covered                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------- |
| US-1       | REQ-015                                                                                           |
| US-2       | REQ-005, REQ-006, REQ-007, REQ-009, REQ-014                                                       |
| US-3       | REQ-004, REQ-005, REQ-007                                                                         |
| US-4       | REQ-005, REQ-008, REQ-009, REQ-015                                                                |
| US-5       | REQ-005, REQ-006, REQ-008, REQ-009, REQ-014                                                       |
| US-6       | REQ-010, REQ-011, REQ-012                                                                         |
| US-7       | REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-014 |
| US-8       | REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, REQ-008, REQ-009, REQ-013, REQ-016          |
| US-9       | All REQ-001 through REQ-016 (test verification layer)                                             |
