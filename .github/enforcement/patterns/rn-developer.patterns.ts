/**
 * sdlc-g2-rn-developer.patterns.ts
 * Canonical implementation patterns for sdlc-g2-rn-developer. Reference for correct structure.
 * DO NOT import — read-only reference file.
 */

// ─────────────────────────────────────────────────────────────
// Component Pattern
// ─────────────────────────────────────────────────────────────

// ✅ ComponentName.types.ts
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

// ✅ ComponentName.tsx — logic-free, delegates to hook
export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  // JSX only — no logic here
  return null;
};

// ─────────────────────────────────────────────────────────────
// Redux Slice Selector Pattern
// ─────────────────────────────────────────────────────────────

// ✅ featureSelectors.ts — named selectors only
export const selectFeatureData = (state: RootState) => state.feature.data;
export const selectFeatureStatus = (state: RootState) => state.feature.status;
// isLoading MUST include 'idle' to prevent flash of empty state
export const selectIsLoading = (state: RootState) =>
  state.feature.status === 'idle' || state.feature.status === 'loading';

// ─────────────────────────────────────────────────────────────
// Saga Pattern
// ─────────────────────────────────────────────────────────────

// ✅ takeLeading for non-idempotent; takeLatest for idempotent
function* watchFeature() {
  yield takeLatest(fetchFeatureAction, fetchFeatureSaga); // idempotent fetch
  yield takeLeading(submitPaymentAction, submitPaymentSaga); // non-idempotent submit
}

// ─────────────────────────────────────────────────────────────
// Mandatory API Call Chain
// ─────────────────────────────────────────────────────────────
// Screen → hook (dispatches action) → saga → service → ApiService → server
//
// Service: thin stateless wrapper around getApiService()
// Saga catch: single error handling point
// Hook: dispatches and reads selectors only — never calls API directly

// ─────────────────────────────────────────────────────────────
// TypeScript Requirements
// ─────────────────────────────────────────────────────────────

// ❌ any type
const bad = (x: any) => x;

// ✅ unknown + type guard
function isString(x: unknown): x is string {
  return typeof x === 'string';
}

// ✅ Discriminated union for async state
type FeatureState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: FeatureData }
  | { status: 'error'; error: AppError };

// ✅ as const for literal maps
const ROUTES = {
  Home: 'Home',
  Payment: 'Payment'
} as const;

declare const React: { FC: unknown };
declare const takeLatest: unknown;
declare const takeLeading: unknown;
declare const fetchFeatureAction: unknown;
declare const fetchFeatureSaga: unknown;
declare const submitPaymentAction: unknown;
declare const submitPaymentSaga: unknown;
interface RootState {
  feature: { data: unknown; status: string };
}
interface FeatureData {}
interface AppError {}
export {};
