---
description: >
  Use when: working with native modules, biometric authentication, device sensors,
  platform-specific files in ios/ or android/ directories, or React Native bridge code.
  Enforces native module patterns, bridge safety, and platform-specific file conventions.
applyTo: "src/**/native/**,ios/**,android/**"
---

# Native Integration Standards

## Native Module Patterns

### Rule N1: No direct native module calls from components

Native modules must be wrapped in a typed TypeScript interface before use in components or hooks.

```ts
// ❌ Direct NativeModules call in component
import { NativeModules } from "react-native";
const { BiometricModule } = NativeModules;

// ✅ Typed wrapper module
import BiometricService from "finvault/core/native/BiometricService";
```

### Rule N2: All native modules have TypeScript interfaces

Every native module must have a corresponding `.types.ts` file declaring the JavaScript-side interface:

```ts
// src/core/native/BiometricService.types.ts
export interface BiometricServiceInterface {
  authenticate(reason: string): Promise<BiometricResult>;
  isAvailable(): Promise<boolean>;
}
```

### Rule N3: Platform-specific files use `.ios.ts` / `.android.ts` extensions

```
src/core/native/
├── HapticFeedback.ts          — shared interface
├── HapticFeedback.ios.ts      — iOS implementation
└── HapticFeedback.android.ts  — Android implementation
```

## Biometric Authentication

- Biometric data is **only** handled by native modules — never stored in JS realm
- Auth tokens resulting from biometric verification are stored via `react-native-keychain` — never MMKV or AsyncStorage
- MPIN and PIN values must never be passed through navigation params (see security-and-review.instructions.md)

## Bridge Safety

### Rule N4: Always check platform availability before calling native module

```ts
// ❌ Calling without availability check
const result = await BiometricService.authenticate("Verify identity");

// ✅ Check availability first
const isAvailable = await BiometricService.isAvailable();
if (isAvailable) {
  const result = await BiometricService.authenticate("Verify identity");
}
```

### Rule N5: Handle bridge errors explicitly

Native module calls can throw `NativeException` in addition to JS errors. Wrap in try/catch and handle both.

```ts
try {
  const result = await BiometricService.authenticate("Verify identity");
  dispatch(biometricAuthSuccessAction(result));
} catch (error) {
  // Native bridge errors are ErrorWithCode objects
  const message =
    error instanceof Error ? error.message : "Authentication failed";
  dispatch(biometricAuthFailureAction(message));
}
```

## iOS-Specific

- Native module registration: `RCT_EXTERN_MODULE` in `.mm` files
- Use `FinVaultApp-Bridging-Header.h` for Objective-C bridging
- Privacy manifest (`PrivacyInfo.xcprivacy`) must be updated when using new system APIs

## Android-Specific

- Native modules extend `ReactContextBaseJavaModule`
- Register modules in `MainApplication.java`
- Add required permissions to `AndroidManifest.xml` with justification comment
