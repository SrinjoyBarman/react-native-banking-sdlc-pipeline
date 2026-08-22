# API Contract Report — BKIEMOB-9 run-001

- **Status:** WARN
- **Scanned file:** [src/auth/services/authService.ts](src/auth/services/authService.ts)

## Summary

Scanned `authService.ts` for API contract compliance against Gate rules (C1–C4).

- No `any` usage detected in service function parameters or return types — C1 PASS.
- Service defines request/response interfaces, but they are declared inline in the service file rather than exported from a co-located `.types.ts` file — C2 VIOLATION (major).
- There are no real `ApiService` calls in this file (mock POC). C3/C4 (missing generic on `ApiService` calls / unguarded casts) are not applicable now, but will be required if the file is converted to call the real `ApiService`.

## Findings

1. Rule C2 — Named request/response interfaces must live in a `.types.ts` file (major)
   - Interfaces found inline in `authService.ts`:
     - `RequestOtpRequest`
     - `RequestOtpResponse`
     - `AuthenticateRequest`
     - `AuthenticateResponse`
   - Location: [src/auth/services/authService.ts](src/auth/services/authService.ts)
   - Impact: Inline types in the service file reduce reusability and violate the project's API contract pattern. This gate expects a co-located `authService.types.ts` exporting these shapes and the service file importing them.

2. Rule C1 — No `any` in service functions (critical)
   - Status: PASS. No `any` occurrences found in parameters or return types.

3. Rule C3 / C4 — `ApiService` generic usage and unguarded casts (major)
   - Status: N/A for current file (mock implementation). If the implementation is switched to call `ApiService`, ensure every call uses explicit generics (e.g., `ApiService.post<LoginResponse>(...)`) and avoid `(await ApiService.get(...)) as SomeType` casts.

## Recommended Remediation

1. Extract interfaces into a co-located types file:

   - Create: `src/auth/services/authService.types.ts`
   - Export the four interfaces from that file and update `authService.ts` to import them.

   Example (types file):

   ```ts
   export interface RequestOtpRequest { mobileNumber: string; userType: 'customer' | 'staff'; }
   export interface RequestOtpResponse { success: boolean; message: string; }
   export interface AuthenticateRequest { mobileNumber: string; otp: string; userType: 'customer' | 'staff'; }
   export interface AuthenticateResponse { success: boolean; token: string; userId: string; }
   ```

   Example (service import):

   ```ts
   import type {
     RequestOtpRequest,
     RequestOtpResponse,
     AuthenticateRequest,
     AuthenticateResponse,
   } from './authService.types';
   ```

2. If switching to real network calls, follow C3/C4:
   - Always pass a generic type to `ApiService` calls: `await ApiService.post<AuthenticateResponse>(...)`.
   - Do not use unguarded `as SomeType` casts on raw responses; prefer typed generics and run-time validation where appropriate.

3. Add a simple unit test for the service to ensure shapes match expected types when integrating with `ApiService` (optional but recommended).

## Gate Result

- `status`: `WARN`
- `violations`: C2 (major)
- `errorCategory`: `business` (only used if `status` = `FAILED`)

---

If you want, I can create the `authService.types.ts` file and update `authService.ts` to import the types and convert one mock call to an `ApiService` example with generics.

**Tokens (estimated):** ~4k in / ~2k out / ~6k total
