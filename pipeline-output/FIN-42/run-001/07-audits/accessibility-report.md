# Accessibility Audit Report - FIN-42 LoginScreen

**Status:** ⚠️ WARN (Non-blocking)
**Date:** 2026-07-17

## Summary

The LoginScreen components generally follow accessibility standards for `testID` and `accessibilityLabel` presence. However, there are systemic issues with `accessibilityRole` missing on some interactive elements, and several hardcoded font sizes that may not support Dynamic Type scaling correctly. Touch target sizes are generally compliant (48pt) except for the footer links.

| Category                 | Status      | Notes                                               |
| :----------------------- | :---------- | :-------------------------------------------------- |
| **VoiceOver Labels**     | ✅ Passed   | All interactive elements have `accessibilityLabel`. |
| **testID Presence**      | ✅ Passed   | All interactive elements have `testID`.             |
| **Dynamic Type Support** | ⚠️ Warn     | Hardcoded font sizes in styles (36, 16, 11).        |
| **accessibilityRole**    | 🔴 Must Fix | Missing roles on `ActionButton` and footer links.   |
| **Touch Target Size**    | ⚠️ Warn     | Footer link target may be < 44pt.                   |

## Detailed Findings

| File                                                                                                                   | Severity          | Line | Finding                                              | Recommendation                                             |
| :--------------------------------------------------------------------------------------------------------------------- | :---------------- | :--- | :--------------------------------------------------- | :--------------------------------------------------------- |
| [src/shared/components/atoms/ActionButton/ActionButton.tsx](src/shared/components/atoms/ActionButton/ActionButton.tsx) | 🔴 Must Fix       | L16  | `Pressable` is missing `accessibilityRole="button"`. | Add `accessibilityRole="button"`.                          |
| [src/shared/components/atoms/ActionButton/ActionButton.tsx](src/shared/components/atoms/ActionButton/ActionButton.tsx) | 🟡 Should Address | L56  | Hardcoded `fontSize: 16`.                            | Use `...typography.body` token.                            |
| [src/auth/screens/LoginScreen/components/FooterSection.tsx](src/auth/screens/LoginScreen/components/FooterSection.tsx) | 🔴 Must Fix       | L10  | `Pressable` is missing `accessibilityRole="link"`.   | Add `accessibilityRole="link"`.                            |
| [src/auth/screens/LoginScreen/LoginScreen.styles.ts](src/auth/screens/LoginScreen/LoginScreen.styles.ts)               | 🟡 Should Address | L44  | `welcomeTitle` uses hardcoded `fontSize: 36`.        | Use theme token if available or enable scaling.            |
| [src/auth/screens/LoginScreen/LoginScreen.styles.ts](src/auth/screens/LoginScreen/LoginScreen.styles.ts)               | 🟡 Should Address | L138 | `buttonText` uses hardcoded `fontSize: 16`.          | Use `...typography.body` token.                            |
| [src/auth/screens/LoginScreen/LoginScreen.styles.ts](src/auth/screens/LoginScreen/LoginScreen.styles.ts)               | 🟡 Should Address | L156 | `footerText` uses hardcoded `fontSize: 11`.          | Minimum accessible font size is usually 12pt.              |
| [src/auth/screens/LoginScreen/LoginScreen.styles.ts](src/auth/screens/LoginScreen/LoginScreen.styles.ts)               | 🟡 Should Address | L159 | `footerLink` uses hardcoded `fontSize: 11`.          | Target size may be < 44pt; add padding or use larger font. |

## Accessibility Checklist (FIN-42)

- [x] Every interactive element has `accessibilityLabel`
- [x] Every interactive element has `testID`
- [ ] Every button has `accessibilityRole="button"` (⚠️ `ActionButton` missing)
- [ ] Every input is keyboard accessible (✅ Standard TextInput used)
- [ ] Minimum touch target 44x44 points (⚠️ Footer links likely too small)
- [ ] Supports Dynamic Type (⚠️ Hardcoded font sizes found)

---

**Auditor:** GitHub Copilot
**Gate:** SDLC_G6_ACCESSIBILITY
