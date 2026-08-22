\*\*Import Boundary Report — BKIEMOB-9 LoginScreen

**Summary**

- **Scanned Files**: auth screens, hook, components, services, and store files under `src/auth`.
- **Result**: 1 violation found; remaining imports conform to rules.

**Findings**

- **Violation**: Deep relative cross-module import: [src/auth/screens/LoginScreen/components/HeroSection.tsx](src/auth/screens/LoginScreen/components/HeroSection.tsx#L10) — `require('../../../../assets/images/hero-image.png')` (line 10). Cross-module resource accessed via a deep relative path; cross-module imports must use `finvault/*` aliases.

- **OK — Alias Usage**: All cross-module code imports use `finvault/*` aliases:
  - [src/auth/screens/LoginScreen/LoginScreen.tsx](src/auth/screens/LoginScreen/LoginScreen.tsx) imports `finvault/shared`.
  - [src/auth/screens/LoginScreen/LoginScreen.styles.ts](src/auth/screens/LoginScreen/LoginScreen.styles.ts#L2) imports `finvault/core`.
  - [src/auth/screens/LoginScreen/useLoginScreen.ts](src/auth/screens/LoginScreen/useLoginScreen.ts#L2-L3) imports `finvault/store` and `finvault/core`.
  - [src/auth/store/authSelectors.ts](src/auth/store/authSelectors.ts#L1) imports `finvault/store`.

- **OK — Internal Relative Imports**: All internal auth imports are relative and located inside the `auth` module (e.g., `./components/*`, `../../store`).

**Impact & Recommendation**

- Replace the deep relative asset require with a cross-module alias import (e.g., add a public barrel under `src/assets` and import via `finvault/assets`), or move the asset reference into a `shared` component that exposes a `finvault/shared` import. This preserves the rule: no deep relative cross-module paths.

**Next Steps**

- Developer: Update [src/auth/screens/LoginScreen/components/HeroSection.tsx](src/auth/screens/LoginScreen/components/HeroSection.tsx#L10) to use a `finvault/*` alias or shared component.
- Optional: Add a public barrel for assets if not present: `src/assets/index.ts` -> export image asset constants.

**Scan Details**

- Files scanned (excerpt):
  - src/auth/screens/LoginScreen/LoginScreen.tsx
  - src/auth/screens/LoginScreen/useLoginScreen.ts
  - src/auth/screens/LoginScreen/components/ActionButton.tsx
  - src/auth/screens/LoginScreen/components/FooterSection.tsx
  - src/auth/screens/LoginScreen/components/FormCard.tsx
  - src/auth/screens/LoginScreen/components/HeroSection.tsx
  - src/auth/screens/LoginScreen/components/MobileField.tsx
  - src/auth/screens/LoginScreen/components/OtpField.tsx
  - src/auth/screens/LoginScreen/components/UserTypeSelectorRow.tsx
  - src/auth/screens/LoginScreen/components/WelcomeHeader.tsx
  - src/auth/screens/LoginScreen/LoginScreen.styles.ts
  - src/auth/services/authService.ts
  - src/auth/store/\*
