/**
 * redux-standards.patterns.ts
 * Canonical patterns for Redux slice structure, store wiring, saga watchers,
 * typed hooks, and test factories.
 * Read-only reference — do NOT import at runtime.
 *
 * This file is self-contained. Foundational type stubs (AppError, AsyncStatus,
 * FeatureState, createInitialState, isLoadingFromStatus, TransferPayload) are
 * declared at the bottom. In the real project these live in finvault/store.
 * Saga WORKER patterns (try/catch, call/put) live in state-and-api.patterns.ts.
 *
 * Sections:
 *   SlicePattern          — createSlice with request/success/failure triplet
 *   SagaOnlyActions       — createAction for saga triggers without reducer cases
 *   WatcherSagaPattern    — takeLatest / takeLeading watcher; rootSaga composition
 *   StoreConfiguration    — configureStore, no thunk, saga middleware
 *   RootTypes             — RootState and AppDispatch derived from store
 *   TypedHooks            — useAppDispatch, useAppSelector
 *   SelectorCoLocation    — file structure and naming rules for selectors
 *   MockStoreFactory      — typed test store without saga middleware
 *   ActionNaming          — action type naming convention
 *   AntiPatterns          — explicit wrong patterns
 */

import {
  combineReducers,
  createStore,
  applyMiddleware,
  Dispatch,
  Store,
  Reducer,
  Action,
  UnknownAction,
} from "redux";
import createSagaMiddleware from "redux-saga";
import {
  all,
  call,
  fork,
  put,
  takeLatest,
  takeLeading,
} from "redux-saga/effects";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: SlicePattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Plain Redux: manual reducer + action creator factory.
 *    Reducer must return new state — never mutate. Immutable patterns:
 *    - {...state, property: newValue}
 *    - Array.map/filter for list updates
 *    Reset reducer uses an explicit return to replace state wholesale.
 *    Async status starts at 'idle'; never skip it.
 */

// Action creator factory — plain functions returning action objects
export const fetchBalanceRequest = () =>
  ({
    type: "dashboard/fetchBalanceRequest",
  }) as const;

export const fetchBalanceSuccess = (payload: DashboardData) =>
  ({
    type: "dashboard/fetchBalanceSuccess",
    payload,
  }) as const;

export const fetchBalanceFailure = (payload: AppError) =>
  ({
    type: "dashboard/fetchBalanceFailure",
    payload,
  }) as const;

export const resetDashboard = () =>
  ({
    type: "dashboard/resetDashboard",
  }) as const;

// Action type constants for reducer pattern matching
const FETCH_BALANCE_REQUEST = "dashboard/fetchBalanceRequest" as const;
const FETCH_BALANCE_SUCCESS = "dashboard/fetchBalanceSuccess" as const;
const FETCH_BALANCE_FAILURE = "dashboard/fetchBalanceFailure" as const;
const RESET_DASHBOARD = "dashboard/resetDashboard" as const;

// Reducer — pure function, no side effects, immutable updates
export const dashboardReducer: Reducer<FeatureState<DashboardData>> = (
  state = createInitialState<DashboardData>(),
  action: UnknownAction,
) => {
  switch (action.type) {
    case FETCH_BALANCE_REQUEST:
      return {
        ...state,
        status: "loading",
        error: null,
      };
    case FETCH_BALANCE_SUCCESS:
      return {
        ...state,
        status: "success",
        data: action.payload,
      };
    case FETCH_BALANCE_FAILURE:
      return {
        ...state,
        status: "error",
        error: action.payload,
        data: null,
      };
    case RESET_DASHBOARD:
      return createInitialState<DashboardData>();
    default:
      return state;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: SagaOnlyActions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Saga-only actions: no reducer case, dispatched by hooks and handled by saga workers.
 *    Useful for write operations whose response commits to a different slice.
 */
export const submitTransferRequest = (payload: TransferPayload) =>
  ({
    type: "payments/submitTransferRequest",
    payload,
  }) as const;

export const submitTransferSuccess = () =>
  ({
    type: "payments/submitTransferSuccess",
  }) as const;

export const submitTransferFailure = (payload: AppError) =>
  ({
    type: "payments/submitTransferFailure",
    payload,
  }) as const;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: WatcherSagaPattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Each feature module owns one watcher saga that combines its effect channel strategies.
 *    takeLatest  — idempotent reads:  cancels previous in-flight call on repeat
 *    takeLeading — non-idempotent writes: ignores new dispatches while active
 *
 *    Worker saga bodies (try/call/put) live in state-and-api.patterns.ts.
 */
export function* dashboardWatcher() {
  yield takeLatest(fetchBalanceRequest, fetchBalanceWorkerStub);
  yield takeLeading(submitTransferRequest, submitTransferWorkerStub);
}

/**
 * ✅ rootSaga: flat all([fork(watcher)]) — one fork per feature module.
 *    Lives exclusively in store/store.ts.
 */
export function* rootSaga() {
  yield all([
    fork(dashboardWatcher),
    // fork(authWatcher),
    // fork(paymentsWatcher),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: StoreConfiguration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Plain Redux store with saga middleware.
 *    All async work goes through sagas — no thunks.
 *    Middleware order: applyMiddleware(sagaMiddleware)
 *    sagaMiddleware.run(rootSaga) must be called after store creation.
 */
export function createAppStore(): AppStore {
  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    combineReducers({
      dashboard: dashboardReducer,
      // auth: authReducer,
      // payments: paymentsReducer,
    }),
    applyMiddleware(sagaMiddleware),
  );

  sagaMiddleware.run(rootSaga);
  return store;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: RootTypes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Derive RootState and AppDispatch from the store — never hand-write them.
 *    Export from store/store.ts; import into feature modules via finvault/store.
 */
export type AppStore = Store<RootState, UnknownAction>;
export type RootState = {
  readonly dashboard: FeatureState<DashboardData>;
  // auth: FeatureState<AuthState>;
  // payments: FeatureState<PaymentsState>;
};
export type AppDispatch = Dispatch<UnknownAction>;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TypedHooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Defined once in store/hooks.ts — import these everywhere.
 *    Never use raw useDispatch / useSelector in feature code.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: SelectorCoLocation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Selector co-location rules:
 *    - File: src/<mfe>/store/<featureName>Selectors.ts — e.g. dashboardSelectors.ts
 *    - Named exports only — no default export
 *    - Input selectors: plain (state) => value functions
 *    - Derived selectors: createSelector — see state-and-api.patterns.ts
 *    - Loading selector uses isLoadingFromStatus from finvault/store
 *
 * Canonical selector implementations (selectBalance, selectDashboardStatus,
 * selectDashboardError, selectFormattedBalance) live in state-and-api.patterns.ts.
 * Only the loading selector is shown here to illustrate isLoadingFromStatus usage.
 */

/** ✅ Delegates to shared helper — 'idle' included, no inline condition duplication */
export const selectDashboardIsLoading = (state: RootState): boolean =>
  isLoadingFromStatus(state.dashboard.status);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: MockStoreFactory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Test store: no saga middleware — control sagas via runSaga or mock them.
 *    Reducer map must exactly match the preloadedState keys — no phantom keys.
 */
export const createMockStore = (preloadedState?: Partial<RootState>) =>
  createStore(
    combineReducers({ dashboard: dashboardReducer }),
    preloadedState as RootState | undefined,
  ) as Store<RootState, UnknownAction>;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ActionNaming
// ─────────────────────────────────────────────────────────────────────────────

// Convention: '<mfeName>/<verbNoun>[Phase]'
//
// 'dashboard/fetchBalanceRequest'   — dispatched from hook; picked up by watcher
// 'dashboard/fetchBalanceSuccess'   — dispatched by saga worker on success
// 'dashboard/fetchBalanceFailure'   — dispatched by saga worker on error
// 'dashboard/resetDashboard'        — synchronous slice reset (no phase suffix)
// 'payments/submitTransferRequest'  — saga-only action (no reducer case)
//
// Phase suffix for async triplets:  Request | Success | Failure
// No suffix for synchronous actions that do not follow the async lifecycle.

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AntiPatterns
// ─────────────────────────────────────────────────────────────────────────────

// ❌ Never mutate state in reducer — always return new object
// state.data = newData;  // wrong — mutation
// return {...state, data: newData};  // correct — new object

// ❌ Never default-export reducers, selectors, or actions
// export default dashboardReducer;  // breaks named-import consistency

// ❌ Never hand-write RootState — derive from combined reducer structure
// type RootState = { dashboard: any };  // too loose

// ❌ Never share a slice key across feature modules
// combineReducers({ shared: sharedReducer })  // couples features

// ❌ Reducer map keys in tests must match RootState structure
// createStore(combineReducers({ _wrong: r }))  // wrong key name

// ❌ Never use configureStore — plain Redux only
// configureStore({ reducer: ... })  // Redux Toolkit, not allowed

// ❌ Never inline action types — use constants and const assertion
// return { type: 'dashboard/fetch' }  // lose type safety
// export const fetchReq = () => ({ type: 'dashboard/fetch' } as const)  // correct

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TypeStubs — real implementations live in finvault/store
// ─────────────────────────────────────────────────────────────────────────────

// Domain types — in real code imported from co-located slice types files:
// import type { DashboardData } from './dashboardSlice.types';
// import type { TransferPayload } from './paymentsSlice.types';
interface DashboardData {
  readonly balance: number;
  readonly accountNumber: string;
}

interface AppError {
  readonly message: string;
  readonly code: string;
}
type AsyncStatus = "idle" | "loading" | "success" | "error";
interface FeatureState<T> {
  readonly data: T | null;
  readonly status: AsyncStatus;
  readonly error: AppError | null;
}
declare const createInitialState: <T>() => FeatureState<T>;
declare function isLoadingFromStatus(status: AsyncStatus): boolean;
interface TransferPayload {
  readonly toAccount: string;
  readonly amount: number;
}

declare function fetchBalanceWorkerStub(): Generator;
declare function submitTransferWorkerStub(action: {
  payload: TransferPayload;
}): Generator;

export {};
