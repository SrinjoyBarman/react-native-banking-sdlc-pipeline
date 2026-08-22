/**
 * state-and-api.patterns.ts
 * Canonical patterns for the API call chain and state consumption.
 * Covers: service layer, saga workers, dispatch-only hooks, and selectors.
 * Read-only reference — do NOT import at runtime.
 *
 * This file is self-contained. Foundational type stubs (AppError, AsyncStatus,
 * DataState, FeatureState, isLoadingFromStatus) are declared at the bottom.
 * In the real project these types live in finvault/core or finvault/store.
 *
 * Sections:
 *   ServiceLayer          — stateless async functions using getApiService()
 *   SagaWorkers           — try/catch workers; single error-handling point
 *   HookLayer             — dispatch-only hooks reading typed selectors
 *   Selectors             — named, co-located, memoized via createSelector
 *   AntiPatterns          — explicit wrong patterns
 */

import { call, put, takeLatest, takeEvery, fork } from "redux-saga/effects";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ServiceLayer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Stateless plain async functions — one responsibility, zero try-catch.
 *    Use getApiService() singleton from core — never instantiate axios.
 *    Errors propagate naturally to the saga catch block.
 */
export const fetchBalanceService = async (): Promise<Balance> => {
  const api = getApiService();
  const response = await api.get<Balance>("/accounts/balance");
  return response.data;
};

export const submitTransferService = async (
  payload: TransferPayload,
): Promise<void> => {
  const api = getApiService();
  await api.post("/payments/transfer", payload);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: SagaWorkers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Worker saga pattern (plain Redux):
 *    1. yield call(service)         — delegates IO
 *    2. yield put(successAction)    — commits result to store
 *    3. catch: yield put(failure)   — single error-handling point
 *    Services never catch; workers always do.
 */
export function* fetchBalanceSaga() {
  try {
    const data: Balance = yield call(fetchBalanceService);
    yield put(fetchBalanceSuccess(data));
  } catch (error) {
    yield put(fetchBalanceFailure(toAppError(error)));
  }
}

export function* submitTransferSaga(
  action: ReturnType<typeof submitTransferRequest>,
) {
  try {
    yield call(submitTransferService, action.payload);
    yield put(submitTransferSuccess());
  } catch (error) {
    yield put(submitTransferFailure(toAppError(error)));
  }
}

/**
 * ✅ Root saga — wires workers to action types using takeLatest/takeEvery.
 *    This is the entry point passed to sagaMiddleware.run().
 *    Use takeLatest for fetch/query operations (latest request wins).
 *    Use takeEvery for non-idempotent operations (form submissions).
 */
export function* rootDashboardSaga() {
  yield takeLatest(FETCH_BALANCE_REQUEST, fetchBalanceSaga);
  yield takeEvery(SUBMIT_TRANSFER_REQUEST, submitTransferSaga);
}

// Watch sagas combine multiple root sagas from different features
export function* watchDashboardSaga() {
  yield fork(rootDashboardSaga);
  // In store/index.ts: combine all feature root sagas
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: HookLayer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Hooks dispatch actions and read selectors — no direct API or service calls.
 *    Return value uses `as const` for a stable, typed shape.
 *    Logic-free: no useCallback, useMemo, or string formatting.
 */
export const useDashboard = () => {
  const dispatch = useAppDispatch();
  const balance = useAppSelector(selectBalance);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectDashboardError);

  const fetchBalance = () => dispatch(fetchBalanceRequest());

  return { balance, isLoading, error, fetchBalance } as const;
};

/**
 * ✅ Navigation and route params belong in the hook — not in the component.
 *    The component receives ready-to-use values and callbacks; it never
 *    imports useNavigation or useRoute directly.
 *
 * ❌ Wrong — navigation logic leaked into the component:
 *    const DashboardScreen = () => {
 *      const navigation = useNavigation();          // ❌ framework hook in component
 *      const route = useRoute<DashboardRouteProp>();
 *      const accountId = route.params.accountId;   // ❌ params parsed in component
 *      const handleViewDetails = () => navigation.navigate('Details', { accountId }); // ❌ hardcoded string instead of Routes enum
 *      ...
 *    };
 */
export const useDashboardNavigation = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const route = useRoute<DashboardRouteProp>();

  const accountId = route.params.accountId;
  const goToDetails = () => navigation.navigate(Routes.Details, { accountId });
  const goBack = () => navigation.goBack();

  return { accountId, goToDetails, goBack } as const;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Selectors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Plain Redux selectors — named, co-located in src/<mfe>/store/<featureName>Selectors.ts.
 *    For plain Redux, selectors are simple functions that extract from state.
 *    If you need memoization later, add reselect's createSelector.
 */
export const selectBalance = (state: RootState) => state.dashboard.data;
export const selectDashboardStatus = (state: RootState): AsyncStatus =>
  state.dashboard.status;
export const selectDashboardError = (state: RootState): AppError | null =>
  state.dashboard.error;

/**
 * ✅ Loading selector delegates to the shared isLoadingFromStatus helper.
 *    Guarantees 'idle' is always included without repeating the condition.
 */
export const selectIsLoading = (state: RootState): boolean =>
  isLoadingFromStatus(state.dashboard.status);

/**
 * ✅ Derived / computed state — plain function.
 *    For memoized selectors (performance optimization), upgrade to reselect later.
 */
export const selectFormattedBalance = (state: RootState): string => {
  const balance = selectBalance(state);
  return balance != null ? `$${balance.amount.toFixed(2)}` : "--";
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: AntiPatterns
// ─────────────────────────────────────────────────────────────────────────────

// ❌ Inline selector in component — always use named selectors from *Selectors.ts
// const balance = useAppSelector(state => state.dashboard.data);

// ❌ Direct axios — bypasses ApiService singleton and interceptors
// import axios from 'axios'; const res = await axios.get('/accounts/balance');

// ❌ API call inside hook — breaks mandatory chain; testability, retry, loading
// const fetchBalance = async () => { const api = getApiService(); ... };

// ❌ try-catch in service — errors must propagate to the saga worker
// export const badService = async () => { try { ... } catch { return null; } };

// ❌ Wrong loading check — misses pre-fetch window, causes flash-of-empty-state
// const isLoading = status === 'loading';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TypeStubs — real implementations live in finvault/core and finvault/store
// ─────────────────────────────────────────────────────────────────────────────

interface AppError {
  readonly message: string;
  readonly code: string;
}
type AsyncStatus = "idle" | "loading" | "success" | "error";
type DataState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };
interface FeatureState<T> {
  readonly data: T | null;
  readonly status: AsyncStatus;
  readonly error: AppError | null;
}
declare function isLoadingFromStatus(status: AsyncStatus): boolean;

// Domain types — in real code imported from co-located slice types files:
// import type { Balance, DashboardData } from './dashboardSlice.types';
// import type { TransferPayload } from './paymentsSlice.types';
interface Balance {
  readonly amount: number;
}
interface TransferPayload {
  readonly toAccount: string;
  readonly amount: number;
}
interface RootState {
  dashboard: FeatureState<Balance>;
}

declare function getApiService(): {
  get<T>(url: string): Promise<{ data: T }>;
  post(url: string, data: unknown): Promise<void>;
};
declare function toAppError(e: unknown): AppError;
declare function useAppDispatch(): (
  action: DashboardAction | PaymentsAction,
) => void;
type DashboardAction =
  | ReturnType<typeof fetchBalanceRequest>
  | ReturnType<typeof fetchBalanceSuccess>
  | ReturnType<typeof fetchBalanceFailure>;
type PaymentsAction =
  | ReturnType<typeof submitTransferRequest>
  | ReturnType<typeof submitTransferSuccess>
  | ReturnType<typeof submitTransferFailure>;
declare function useAppSelector<T>(selector: (s: RootState) => T): T;
const enum Routes {
  Details = "Details",
  Dashboard = "Dashboard",
}
type DashboardNavigationProp = {
  navigate(screen: Routes, params?: object): void;
  goBack(): void;
};
type DashboardRouteProp = { params: { accountId: string } };
declare function useNavigation<T>(): T;
declare function useRoute<T>(): T;
// Plain Redux action creator factory — typed with const assertion for type safety
// Real implementation: const FETCH_BALANCE_REQUEST = 'dashboard/FETCH_BALANCE_REQUEST';
// Action creators via createAction factory or manual object creation
const FETCH_BALANCE_REQUEST = "dashboard/FETCH_BALANCE_REQUEST" as const;
const FETCH_BALANCE_SUCCESS = "dashboard/FETCH_BALANCE_SUCCESS" as const;
const FETCH_BALANCE_FAILURE = "dashboard/FETCH_BALANCE_FAILURE" as const;

declare const fetchBalanceRequest: () => {
  readonly type: typeof FETCH_BALANCE_REQUEST;
};
declare const fetchBalanceSuccess: (data: Balance) => {
  readonly type: typeof FETCH_BALANCE_SUCCESS;
  readonly payload: Balance;
};
declare const fetchBalanceFailure: (error: AppError) => {
  readonly type: typeof FETCH_BALANCE_FAILURE;
  readonly payload: AppError;
};

const SUBMIT_TRANSFER_REQUEST = "payments/SUBMIT_TRANSFER_REQUEST" as const;
const SUBMIT_TRANSFER_SUCCESS = "payments/SUBMIT_TRANSFER_SUCCESS" as const;
const SUBMIT_TRANSFER_FAILURE = "payments/SUBMIT_TRANSFER_FAILURE" as const;

declare const submitTransferRequest: (payload: TransferPayload) => {
  readonly type: typeof SUBMIT_TRANSFER_REQUEST;
  readonly payload: TransferPayload;
};
declare const submitTransferSuccess: () => {
  readonly type: typeof SUBMIT_TRANSFER_SUCCESS;
};
declare const submitTransferFailure: (error: AppError) => {
  readonly type: typeof SUBMIT_TRANSFER_FAILURE;
  readonly payload: AppError;
};

export {};
