---
description: >
  Use when: working with Redux state, sagas, selectors, or API calls. Enforces the
  mandatory API call chain, Redux patterns, selector rules, and async side effect
  handling with Redux-Saga.
applyTo: 'src/**/+(store|sagas|slices|selectors|services)/**/*.ts'
---

# State Management & API Patterns

## State Management

- Plain Redux reducers for feature state
- Redux-Saga for all async side effects
- `takeLeading` for non-idempotent actions (login, payment submission)
- `takeLatest` for idempotent actions (search, data fetch)
- Every slice has co-located **named selectors** in `*Selectors.ts` — no inline `state =>` lambdas outside selector files
- Keep state local unless multiple screens need it — pages own form state via `useState`

### Loading State Pattern

**Critical:** Loading state must include `'idle'` status to prevent flash-of-empty-state:

```ts
// ✅ Correct
const isLoading = status === 'idle' || status === 'loading';

// ❌ Wrong
const isLoading = status === 'loading';
```

This ensures skeleton screens show before the initial fetch dispatches.

### State Shape

Use discriminated unions for async state:

```ts
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError };
```

## API Call Chain (Mandatory — No Layer May Be Skipped)

```
Screen → hook (dispatches action) → saga → service → ApiService → (server)
```

**Rules:**

- All HTTP calls go through the **`getApiService()` singleton** in `core`
- Never instantiate axios directly
- **Service functions** are stateless plain functions — thin wrappers around the ApiService instance
- **Errors propagate naturally** — saga `catch` block is the single point of error handling
- No try-catch in services — let errors bubble up to sagas

### Example Flow

```ts
// Screen / Hook
const { fetchBalance } = useDashboard();
useEffect(() => {
  dispatch(fetchBalanceRequest());
}, []);

// Saga
function* fetchBalanceSaga() {
  try {
    const data = yield call(fetchBalanceService);
    yield put(fetchBalanceSuccess(data));
  } catch (error) {
    yield put(fetchBalanceFailure(toAppError(error)));
  }
}

// Service
export const fetchBalanceService = async (): Promise<Balance> => {
  const api = getApiService();
  const response = await api.get<Balance>('/accounts/balance');
  return response.data;
};
```

## Selector Rules

- Named exports only — no default exports
- Co-located with slice in `*Selectors.ts`
- Use `createSelector` from Reselect for derived/computed state
- Never inline selectors in components — always import from selectors file

```ts
// ✅ Correct
export const selectBalance = (state: RootState) => state.dashboard.balance;
export const selectIsLoading = (state: RootState) =>
  state.dashboard.status === 'idle' || state.dashboard.status === 'loading';

// In component
const balance = useAppSelector(selectBalance);

// ❌ Wrong
const balance = useAppSelector(state => state.dashboard.balance);
```
