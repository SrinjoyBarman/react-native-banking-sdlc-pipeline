---
description: >
  Use when: writing or reviewing service layer code in src/**/services/**. Enforces
  typed API contracts, named request/response interfaces, generic ApiService calls,
  and error handling patterns.
applyTo: 'src/**/services/**/*.ts'
---

# API Design Standards

## Service Layer Rules

Every service file must adhere to the mandatory API call chain:

```
Component/Screen → hook → saga → service → ApiService
```

No layer may be skipped. Services are the **only** place where `ApiService` is called.

## Typed Contracts

### Rule 1: No `any` in service function signatures

```ts
// ❌ Untyped service function
async function fetchBalance(accountId: any): Promise<any> { ... }

// ✅ Fully typed
async function fetchBalance(accountId: string): Promise<AccountBalanceResponse> { ... }
```

### Rule 2: Generic type argument on every `ApiService` call

```ts
// ❌ No return type — compiler assumes unknown/any
const data = await ApiService.get('/accounts');

// ✅ Explicit response shape
const data = await ApiService.get<AccountListResponse>('/accounts');
```

### Rule 3: Co-located `.types.ts` file for all request/response shapes

Every service file `FooService.ts` must have `FooService.types.ts` exporting all interfaces.

```
src/dashboard/services/
├── AccountService.ts
├── AccountService.types.ts   ← request/response interfaces here
└── AccountService.test.ts
```

### Rule 4: No unguarded `as` cast on API responses

```ts
// ❌ Unguarded cast — hides shape mismatches at runtime
const balance = (await ApiService.get('/balance')) as BalanceResponse;

// ✅ Use typed generic — compiler validates the shape
const balance = await ApiService.get<BalanceResponse>('/balance');
```

## Error Handling

Services must **not** swallow errors. Propagate them to the calling saga for uniform error handling.

```ts
// ❌ Swallowed error — saga never receives the failure
async function fetchBalance(
  accountId: string
): Promise<AccountBalanceResponse> {
  try {
    return await ApiService.get<AccountBalanceResponse>(
      `/accounts/${accountId}/balance`
    );
  } catch {
    return { balance: 0, currency: 'USD' }; // ❌ hides failure
  }
}

// ✅ Let the saga handle errors
async function fetchBalance(
  accountId: string
): Promise<AccountBalanceResponse> {
  return ApiService.get<AccountBalanceResponse>(
    `/accounts/${accountId}/balance`
  );
}
```

## File Structure

```
src/{feature}/services/
├── {Feature}Service.ts         — implementation
├── {Feature}Service.types.ts   — request/response interfaces
└── {Feature}Service.test.ts    — contract tests (success + failure + edge)
```

## Contract Tests

Every service function must have a test covering:

1. **Success path** — happy path with full mock response
2. **Failure path** — API error propagated correctly
3. **Edge case** — empty list, zero value, null/undefined response field

See `sdlc-g4.5-contract-test.agent.md` for automated enforcement.
