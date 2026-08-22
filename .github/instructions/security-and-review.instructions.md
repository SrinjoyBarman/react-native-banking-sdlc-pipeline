---
description: >
  Use when: handling sensitive data, reviewing code, performing security audits,
  or updating project standards. Covers security essentials, code review checklist,
  and continuous learning process.
applyTo: "**/*"
---

# Security & Review Standards

## Security Essentials

### Secrets Management

- **No secrets in source code** — ever
- No API keys, tokens, passwords, or credentials in any file except `.env` (which is gitignored)
- Auth tokens stored via `react-native-keychain` — **never** MMKV or AsyncStorage
- Biometric data handled only by native modules — never stored in JS realm

### Data Protection

- No sensitive data in Redux state or logs
- No PII (Personally Identifiable Information) in analytics events
- Sanitize all error messages before logging — no user data in error logs
- Use HTTPS for all API calls (enforced by ApiService)

### Input Validation

- Validate all user input before dispatch
- Sanitize input for SQL injection, XSS, and script injection
- Validate amounts, dates, and enum values against expected ranges
- Never trust navigation params — validate before use
- **OTP / code fields:** validate `length === N` (exact length), not just truthiness — `!!otpValue` passes for a 1-digit partial entry
- **Phone / PIN / numeric inputs:** apply a numeric-only filter in the `onChange` handler (`value.replace(/[^0-9]/g, '')`) — do not rely on `keyboardType="numeric"` alone, as it is not enforced on all platforms

```ts
// ✅ Correct — exact-length OTP guard
const isValid = otpValue.length === 6;

// ❌ Wrong — passes for any non-empty partial entry
const isValid = !!otpValue;

// ✅ Correct — numeric-only filter in handler
const handleMobileChange = (text: string) =>
  setMobile(text.replace(/[^0-9]/g, ""));
```

### Mock / Test Data — No PII

- Mock service responses must not contain real phone numbers, names, email addresses, or any value that could be mistaken for real user data
- Use obviously synthetic values: `'user@example.com'`, `'+1234567890'`, `'Test User'`
- Response `message` fields in mock data must not include real account numbers, addresses, or identifiers

### Cryptography

- **Never use `Math.random()`** for security-sensitive values — it is not cryptographically secure
- MPIN entry, token/OTP generation, and security-critical shuffles must use `crypto.getRandomValues()` via the `react-native-get-random-values` polyfill
- Randomised number pads and keypad ordering must use a CSPRNG

```ts
// ✅ Correct — cryptographically secure random
import "react-native-get-random-values";
const array = new Uint32Array(1);
crypto.getRandomValues(array);
const secureDigit = array[0] % 10;

// ❌ Wrong — predictable, never use for security
const insecureDigit = Math.floor(Math.random() * 10);
```

### Navigation Params — Sensitive Data

- **Never pass MPIN, PIN, passwords, or credentials via navigation params** — navigation history can expose them in logs and gesture stacks
- Share sensitive in-flight values through an in-memory `useRef` or a short-lived Redux slice that is cleared after submission
- Always clear MPIN/PIN from state immediately after the confirmation step completes

```ts
// ✅ Correct — in-memory ref, never in route params
const mpinRef = useRef("");
// OR: dispatch to a temp Redux slice, then dispatch clearTempMPIN() on confirm

// ❌ Wrong — MPIN visible in navigation history and error logs
navigation.navigate("ConfirmMPIN", { mpin: "123456" });
```

### Dependency Security

- `npm audit` must show no Critical/High vulnerabilities in production deps
- Run `npm audit --production` to check only production dependencies
- Update vulnerable packages immediately or add to risk register

## Merge Request Review Checklist

When reviewing code (human or agent):

1. **Post each finding as an inline diff comment** — one thread per finding
2. **Severity prefixes:**
   - 🔴 Must fix (blocking)
   - 🟡 Should address (non-blocking but important)
   - ℹ️ Informational (suggestions, best practices)

### Review Checklist

**Module Boundaries:**

- [ ] No cross-module deep imports — only barrel imports (`finvault/*`)
- [ ] Cross-module communication only through Redux or navigation params
- [ ] Dependency graph respected (see project-architecture.instructions.md)

**Component Standards:**

- [ ] All components use `React.FC<Props>` arrow function syntax
- [ ] Props in separate `.types.ts` file
- [ ] Logic extracted to hooks
- [ ] Component folder structure followed

**API & State:**

- [ ] API call chain complete: hook → saga → service → ApiService
- [ ] Named selectors used (no inline `state =>` lambdas)
- [ ] Loading state includes `'idle'` check

**UI & Accessibility:**

- [ ] `testID` on all interactive elements
- [ ] `accessibilityLabel` on all interactive/pressable elements (not just `testID`)
- [ ] No hardcoded colors or spacing
- [ ] No inline strings — use constants
- [ ] FlatList for dynamic lists (not .map in ScrollView)

**Security — Sensitive Data:**

- [ ] No `Math.random()` in security-critical code paths
- [ ] No sensitive data (MPIN, PIN, passwords) passed through navigation params
- [ ] Sensitive in-flight state cleared after use

**Code Quality:**

- [ ] No `any` types
- [ ] No dead code or TODOs
- [ ] No magic values
- [ ] Naming conventions followed
- [ ] No circular dependencies

**Testing:**

- [ ] Tests cover success, failure, and edge cases
- [ ] Coverage ≥ 80%
- [ ] Proper mocks for Redux and native modules

## Continuous Learning — Auto-Update `.github` Files

Whenever a conversation produces a new framework decision, architectural refinement, coding gate, naming norm, or any improvement to project standards:

1. **Identify the affected file(s)** in `.github/` — instruction files or agent definitions in `agents/`
2. **Apply the change immediately** — edit the relevant `.md` file(s) so the updated rule is enforced from the next interaction onward
3. **Scope the edit precisely** — add, update, or remove only sections that reflect the agreed change
4. **Preserve consistency** — ensure the update aligns with existing formatting, terminology, and section structure

This ensures the project continuously improves and captures institutional knowledge.
