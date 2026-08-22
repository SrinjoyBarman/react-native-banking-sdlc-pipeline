---
description: >
  Use when: adding analytics tracking, screen view events, or user action events
  in any screen, hook, or component. Enforces event naming conventions, PII rules,
  and mandatory instrumentation points.
applyTo: "src/**/*.{ts,tsx}"
---

# Analytics & Observability Standards

## Mandatory Instrumentation Points

### 1. Screen View Events

Every screen component (`src/**/screens/`, `src/**/pages/`) must fire a screen view event **on mount**:

```ts
import { SCREEN_EVENTS } from 'finvault/core/analytics';

const DashboardScreen: React.FC = () => {
  useEffect(() => {
    analytics.screen(SCREEN_EVENTS.DASHBOARD);
  }, []);
  return <View>...</View>;
};
```

### 2. Key Action Events

The following handler names **must** fire an analytics event before dispatching:

| Handler Pattern         | Required Event Category     |
| ----------------------- | --------------------------- |
| `onConfirm`, `onSubmit` | `ACTION_EVENTS.*_CONFIRMED` |
| `onTransfer`, `onPay`   | `ACTION_EVENTS.*_INITIATED` |
| `onLogin`, `onVerify`   | `ACTION_EVENTS.*_ATTEMPTED` |
| `onError`               | `ACTION_EVENTS.*_FAILED`    |

## Event Naming Conventions

All event names must be defined as constants — no inline strings.

```ts
// ❌ Inline string
analytics.track("dashboard_viewed");

// ✅ Named constant from central registry
import { SCREEN_EVENTS, ACTION_EVENTS } from "finvault/core/analytics";
analytics.screen(SCREEN_EVENTS.DASHBOARD);
analytics.track(ACTION_EVENTS.TRANSFER_INITIATED, { amount });
```

Event constant naming:

- Screen events: `SCREEN_EVENTS.MODULE_SCREEN_NAME` (UPPER_SNAKE_CASE)
- Action events: `ACTION_EVENTS.ENTITY_VERB` (UPPER_SNAKE_CASE)

## PII Rules (Critical — Never Violate)

**Never** include the following in analytics event properties:

- Account numbers, IBAN, sort codes
- Full names, usernames
- Email addresses
- Phone numbers
- National IDs, passport numbers
- Card numbers, CVV, expiry dates
- Addresses (street, city, postcode)
- Exact transaction amounts tied to individual accounts (use ranges instead)

```ts
// ❌ PII in event properties
analytics.track(ACTION_EVENTS.TRANSFER_INITIATED, {
  accountNumber: account.number, // ❌
  recipientName: recipient.name, // ❌
  email: user.email, // ❌
});

// ✅ Opaque IDs and non-identifying fields only
analytics.track(ACTION_EVENTS.TRANSFER_INITIATED, {
  accountId: account.id, // opaque UUID
  recipientId: recipient.id, // opaque UUID
  currency: payload.currency, // not PII
  amountBucket: getAmountBucket(payload.amount), // range, e.g. '100-500'
});
```

## Analytics Module Location

All analytics constants live in `src/core/analytics/`:

```
src/core/analytics/
├── events.ts          — SCREEN_EVENTS and ACTION_EVENTS constants
├── analytics.ts       — analytics() singleton / wrapper
└── analytics.types.ts — EventProperties interfaces
```

Import via the barrel: `import { analytics, SCREEN_EVENTS, ACTION_EVENTS } from 'finvault/core/analytics'`

## Gate Enforcement

Observability violations are checked by `sdlc-g2.8-observability.agent.md` in the parallel quality gate cluster.
