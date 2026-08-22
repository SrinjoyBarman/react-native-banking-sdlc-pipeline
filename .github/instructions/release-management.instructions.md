---
description: >
  Use when: preparing a release, bumping versions, updating CHANGELOG, or modifying
  build configuration files. Enforces version consistency across iOS, Android, and npm,
  and ensures release hygiene standards are met.
applyTo: "android/app/build.gradle,ios/FinVaultApp/Info.plist,package.json,CHANGELOG.md"
---

# Release Management Standards

## Version Consistency Rule

All three version sources must be in sync before a release:

| File                         | Field                                 |
| ---------------------------- | ------------------------------------- |
| `package.json`               | `"version": "X.Y.Z"`                  |
| `ios/FinVaultApp/Info.plist` | `CFBundleShortVersionString`          |
| `android/app/build.gradle`   | `versionName "X.Y.Z"` + `versionCode` |

The `versionCode` in `android/app/build.gradle` must be incremented (never repeated) for every build uploaded to the Play Store.

## CHANGELOG Convention

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

```markdown
## [Unreleased]

## [1.4.0] — 2024-01-15

### Added

- Feature X: brief description

### Fixed

- Bug Y: brief description

### Security

- Dependency upgrade: brief description
```

- **Every release version must have an entry** — missing entry blocks the G9 release readiness gate
- The `[Unreleased]` section captures in-progress work
- Security fixes must be in a separate `### Security` section

## Pre-Release Checklist (enforced by G9 gate)

Before tagging a release:

- [ ] Version bumped in all three files (package.json, Info.plist, build.gradle)
- [ ] CHANGELOG has an entry for the new version
- [ ] No unguarded `console.log` / `console.warn` in production source
- [ ] No `TODO` / `FIXME` / `HACK` comments in changed production files
- [ ] `.env.example` is in sync with all `process.env.` references in `src/`
- [ ] No test artifacts (`jest.mock`, `jest.fn`) in production source files
- [ ] `npm audit --production` shows no Critical/High vulnerabilities

## Debug Flags

`__DEV__` is the approved guard for development-only code:

```ts
// ✅ DEV-only logging — not included in production bundle
if (__DEV__) {
  console.log("[AccountService] Response:", response);
}

// ❌ Unguarded — appears in production builds
console.log("[AccountService] Response:", response);
```

## Environment Variable Documentation

Every new `process.env.MY_VAR` reference in `src/` must have a corresponding entry in `.env.example` with a descriptive comment:

```bash
# .env.example
# API base URL for the FinVault backend
API_BASE_URL=https://api.example.com

# Feature flag: enable biometric login (true/false)
ENABLE_BIOMETRIC=true
```
