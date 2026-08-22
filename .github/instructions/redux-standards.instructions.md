---
description: >
  Use when: creating or modifying Redux slices, store configuration, saga
  watchers, typed hooks, action creators, or test store factories. Enforces
  slice structure, action naming, middleware setup, and testing conventions.
applyTo: "{src/store/*.ts,src/**/store/**/*.ts}"
---

# Redux Standards

> **Pattern source:** All TypeScript examples are in
> `.github/enforcement/patterns/redux-standards.patterns.ts`.
> Service functions, saga workers, and selector implementations are in
> `state-and-api.instructions.md`.

---

## Slice Structure

Every async feature uses `createSlice` with a **request / success / failure** reducer triplet initialised via `createInitialState<T>()` from `finvault/store`. Immer allows direct mutation inside reducers — never mutate state outside a reducer. Reset reducers must return a new state object explicitly; do not use spread or `Object.assign`. Always destructure and named-export actions from `slice.actions`. No default exports for reducers, actions, or selectors.

> See: `redux-standards.patterns.ts` — SlicePattern

---

## Saga-only Actions

For write operations whose response does not update the dispatching slice's own state, use `createAction` from RTK with no reducer case. This decouples the trigger from the slice and keeps the watcher saga as the sole owner of the side effect.

> See: `redux-standards.patterns.ts` — SagaOnlyActions

---

## Action Naming Convention

Pattern: `'<mfeName>/<verbNoun>[Phase]'`

| Action                           | When dispatched                                 |
| -------------------------------- | ----------------------------------------------- |
| `dashboard/fetchBalanceRequest`  | Hook dispatches to trigger the saga watcher     |
| `dashboard/fetchBalanceSuccess`  | Saga worker dispatches on resolved service call |
| `dashboard/fetchBalanceFailure`  | Saga worker dispatches on caught error          |
| `dashboard/resetDashboard`       | Synchronous reset — no phase suffix             |
| `payments/submitTransferRequest` | Saga-only trigger; no reducer case              |

Phase suffixes for async triplets: **Request → Success → Failure**. Omit the phase suffix for synchronous reducers that do not follow the async lifecycle.

---

## Watcher Saga Pattern

Each feature module owns exactly one watcher saga. Saga worker bodies (try/call/put) are the concern of `state-and-api.instructions.md`. Choose the effect channel based on operation type:

| Channel       | Use case               | Behaviour                                               |
| ------------- | ---------------------- | ------------------------------------------------------- |
| `takeLatest`  | Data fetch, search     | Cancels previous in-flight call on repeat dispatch      |
| `takeLeading` | Payment submit, login  | Ignores new dispatches while the current call is active |
| `takeEvery`   | Fire-and-forget events | Runs every dispatch concurrently — use sparingly        |

> See: `redux-standards.patterns.ts` — WatcherSagaPattern

---

## rootSaga Composition

The root saga uses a flat `all([fork(watcher)])` — one `fork` per feature module watcher, no nesting. It lives exclusively in `store/store.ts` and is run once via `sagaMiddleware.run(rootSaga)` after `configureStore`.

> See: `redux-standards.patterns.ts` — WatcherSagaPattern (rootSaga)

---

## Store Configuration

The store is configured with `thunk: false` — all async work goes through sagas; thunks are never used. Append `sagaMiddleware` via `.concat()` on the result of `getDefaultMiddleware` — never spread the middleware array.

> See: `redux-standards.patterns.ts` — StoreConfiguration

---

## Root Types

`RootState`, `AppStore`, and `AppDispatch` are always derived from the store factory — never hand-written. Export them from `store/store.ts` and import into feature feature modules via `finvault/store`.

> See: `redux-standards.patterns.ts` — RootTypes

---

## Typed Hooks

`useAppDispatch` and `useAppSelector` are defined once in `store/hooks.ts`. Import them from `finvault/store` everywhere — never use raw `useDispatch` or `useSelector` in feature code.

> See: `redux-standards.patterns.ts` — TypedHooks

---

## Selector Co-location

Selectors live in `<featureName>Selectors.ts` inside the feature module's `store/` folder (e.g., `src/dashboard/store/dashboardSelectors.ts`). The loading selector must delegate to `isLoadingFromStatus` from `finvault/store` — never inline the condition. Canonical selector implementations (input selectors, `createSelector` derivations) are owned by `state-and-api.instructions.md`.

> See: `redux-standards.patterns.ts` — SelectorCoLocation

---

## Testing — Mock Store Factory

Test stores use no saga middleware — control sagas via `runSaga` or mock them separately. The reducer map keys in `combineReducers` must exactly match the `preloadedState` keys — phantom keys cause TypeScript errors and incorrect state. Use a typed `MockStoreState` interface, not `Partial<RootState>`. One `createMockStore` factory per slice under test; do not share across test files.

> See: `redux-standards.patterns.ts` — MockStoreFactory

---

## Module Boundaries

Each feature module owns its own slice key — never share a slice across feature modules. Cross-feature module communication goes through the store or navigation params only. Import from `finvault/store` (public barrel) — never via deep relative paths into another feature module's source.

---

## Anti-patterns

Never use thunks — `thunk: false` is mandatory in `getDefaultMiddleware`. All async work goes through sagas only.

Never default-export reducers, actions, or selectors. All exports from slice files and selector files must be named exports.

Never hand-write `RootState` as a type literal. It must always be derived from the store factory so it stays in sync as slices are added.

Never use raw `useDispatch` or `useSelector` in feature code. Always import `useAppDispatch` and `useAppSelector` from `finvault/store`.

> See: `redux-standards.patterns.ts` — AntiPatterns
