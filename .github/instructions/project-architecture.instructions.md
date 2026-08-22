---
description: >
  Use when: understanding project structure, checking module boundaries, validating
  imports between feature modules, or working across multiple modules. Defines the
  high-level architecture and dependency graph.
applyTo: "src/**/*"
---

# Project Architecture

## Project Overview

React Native digital banking app — single repository with feature-based feature modules under `src/*/`, host app shell in `App.tsx`.

## Tech Stack

- **React Native 0.86.0**, TypeScript 5 (`strict: true`)
- **Redux + Redux-Saga** for all async side effects
- React Navigation, axios, react-native-keychain, react-native-gesture-handler
- Jest + react-test-renderer for unit tests

## Project Structure

```
App.tsx                   Host shell — Redux Provider + RootNavigator
src/
  core/                Framework kernel: ApiService, theme, constants, routes, utils
  shared/              Shared UI components (atoms/molecules used across feature modules)
  store/               Composition root: Redux store, typed hooks
  auth/                Auth feature module: login, biometric, token management
    native/               Native biometric bridge (BiometricModule, useBiometric)
  onboarding/          Onboarding feature module: first-launch flow
  dashboard/           Dashboard feature module: account overview, balance
  payments/            Payments feature module: transfers, bill pay
  cards/               Cards feature module: card management, limits
  profile/             Profile feature module: settings, preferences
  storage/             Storage utilities: MMKV + Keychain wrappers
```

## Module Boundaries

Each `*` folder is a self-contained module. Cross-module communication goes through the Redux store or navigation params only. Import from a module's **public barrel only** (`finvault/auth`) — **never deep internal paths**.

### Dependency Graph

| Module                                      | May import from               |
| ------------------------------------------- | ----------------------------- |
| `core`                                      | nothing                       |
| `shared`                                    | `core`                        |
| `storage`                                   | `core`                        |
| `auth`                                      | `core`, `storage`, `shared`   |
| `onboarding`                                | `core`, `shared`              |
| `store`                                     | all (composition root)        |
| `dashboard`, `payments`, `cards`, `profile` | `core`, `shared`, `store`     |
| `App.tsx`                                   | `store`, `auth`, `onboarding` |

## Import Aliases

All cross-module imports use `finvault/*` aliases — **no deep relative paths** like `../../../../`.

```ts
// ✅ correct
import { useBiometric } from "finvault/auth";
import { colors, spacing } from "finvault/core";

// ❌ wrong
import { useBiometric } from "../../auth/native/useBiometric";
```

Relative imports are allowed **only within the same module folder**.

## Circular Dependency Prevention

### Store Composition Root — Import Feature Internals Directly

`store/store.ts` is the Redux composition root. It **must import feature slices and sagas directly from feature internal paths** — **never from feature barrels** (`finvault/auth`).

Using a feature barrel in `store.ts` creates a cycle:

- `store.ts` imports `finvault/auth` → barrel resolves to `auth/index.ts`
- `auth/index.ts` (or its hooks) imports `finvault/store` for typed hooks
- Result: `store → auth barrel → auth hooks → store` ← **cycle**

```ts
// ✅ Correct — store imports directly from feature internals (breaks the cycle)
import { authSlice } from "../auth/store/authSlice";
import { watchAuth } from "../auth/sagas/authSagas";

// ❌ Wrong — barrel import from store.ts creates a circular dependency
import { authSlice } from "finvault/auth";
```

**This exception applies only to `store/store.ts`.** All other modules continue to use `finvault/*` barrel imports as normal.
