/**
 * FinVault Test Utilities — renderWithProviders
 *
 * Created by sdlc-g4-test-fixer when P1 (Test Utilities) fix is applied.
 * Place at: src/test-utils/test-providers.tsx
 */

import React from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { createStore, combineReducers, Store, UnknownAction } from "redux";
import { NavigationContainer } from "@react-navigation/native";
import { MPINFlowProvider } from "finvault/onboarding";

interface TestProvidersProps {
  children: React.ReactNode;
  initialState?: any;
  mpinRef?: React.MutableRefObject<string>;
  onMPINComplete?: () => void;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  initialState = {},
  mpinRef = { current: "" },
  onMPINComplete = jest.fn(),
}) => {
  const store: Store<any, UnknownAction> = createStore(
    combineReducers({
      // Add your reducers here
      // Example: dashboard: dashboardReducer
    }),
    initialState,
  );

  return (
    <Provider store={store}>
      <NavigationContainer>
        <MPINFlowProvider value={{ mpinRef, onMPINComplete }}>
          {children}
        </MPINFlowProvider>
      </NavigationContainer>
    </Provider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    initialState?: any;
    mpinRef?: React.MutableRefObject<string>;
    onMPINComplete?: () => void;
  },
) => {
  const { initialState, mpinRef, onMPINComplete, ...renderOptions } =
    options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        initialState={initialState}
        mpinRef={mpinRef}
        onMPINComplete={onMPINComplete}
      >
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
};
