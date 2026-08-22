# Observability Report — BKIEMOB-9 (LoginScreen)

Date: 2026-07-17

Files reviewed:
- [src/core/constants/analytics.ts](src/core/constants/analytics.ts)
- [src/auth/screens/LoginScreen/useLoginScreen.ts](src/auth/screens/LoginScreen/useLoginScreen.ts)

Summary: All required analytics instrumentation checks passed. No PII found in analytics payloads; events use central constants and fire in the correct order.

Checks

1) Screen view event on mount (Rule O1)
- Expected: `SCREEN_EVENTS.LOGIN` fired in a `useEffect` with empty dependency array.
- Observed: `analytics.screen(SCREEN_EVENTS.LOGIN)` is called inside `useEffect(..., [])` in `useLoginScreen`.
- Result: PASS (major)

2) Action events before saga dispatch (Rule O2)
- Expected: `ACTION_EVENTS.OTP_ATTEMPTED` when GET OTP tapped, and `ACTION_EVENTS.LOGIN_ATTEMPTED` when AUTHENTICATE tapped; analytics.track must be called before dispatch.
- Observed: In `handleGetOtp`, `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)` is called immediately before `dispatch(requestOtpStart(...))`.
- Observed: In `handleAuthenticate`, `analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)` is called immediately before `dispatch(authenticateStart(...))`.
- Result: PASS (major)

3) No PII in event properties (Rule O3)
- Expected: No mobile numbers, OTPs, emails, names, or other PII sent as analytics event properties.
- Observed: All `analytics.track` calls pass only the event constant (no payload), e.g. `analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)`.
  - The `dispatch` calls send `mobileNumber` and `otp` to the saga, but these are not included in analytics payloads.
- Result: PASS (critical)

4) Event constants defined and used (Rule O4)
- Expected: No hardcoded event-name strings; use central constants.
- Observed: `SCREEN_EVENTS` and `ACTION_EVENTS` are defined in `src/core/constants/analytics.ts` and referenced via `SCREEN_EVENTS.LOGIN` and `ACTION_EVENTS.*` in `useLoginScreen`.
- Result: PASS (major)

Overall Gate Result

- Gate: SDLC_G2.8_OBSERVABILITY — Result: PASS
- Notes: No O3 (PII) violations detected. No O1/O2/O4 warnings.

Recommendations

- Keep analytics payloads minimal and continue using opaque IDs when needed.
- If analytics implementation later needs properties (e.g., `accountId`), ensure they are opaque UUIDs and not PII.

Artifact

- This file: `pipeline-output/BKIEMOB-9/run-001/03-quality/observability-report.md`

**Tokens (estimated):** ~4k in / ~2k out / ~6k total
