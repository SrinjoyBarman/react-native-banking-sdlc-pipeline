/**
 * banking-standards.patterns.ts
 * Reference patterns for banking-standards.instructions.md. Shows ✅ correct and ❌ violation
 * examples for each FinVault banking standard rule. Used by agents to recognise violations
 * during code review and generation.
 * DO NOT import — read-only reference file.
 */

import {
  getCurrencyExponent,
  toMinorUnits,
} from "../constants/decimal-constants";

// ─────────────────────────────────────────────────────────────
// Rule 1: Money Representation — no floats; typed Money only
// ─────────────────────────────────────────────────────────────

// ❌ Raw float for a monetary value
const badFee: number = 1.5;

// ✅ Integer minor units wrapped in a typed Money object
interface Money {
  minorUnits: number;
  currency: CurrencyCode;
}
const goodFee: Money = { minorUnits: 150, currency: "GBP" };

// ─────────────────────────────────────────────────────────────
// Rule 2: API Decimal Contract — normalise at the boundary
// ─────────────────────────────────────────────────────────────

// ❌ Accepting raw float from API response without normalisation
const badMapper = (response: { amount: number; currency: string }) => ({
  amount: response.amount, // 1.5 or 1.500? unknown exponent
});

// ✅ Normalise to minor units at the API boundary; throw on exponent mismatch
const goodMapper = (response: {
  amount: number;
  currency: CurrencyCode;
}): Money => {
  const expectedExponent = getCurrencyExponent(response.currency); // e.g. GBP → 2, KWD → 3
  const actualDecimalPlaces = (response.amount.toString().split(".")[1] ?? "")
    .length;
  if (actualDecimalPlaces > expectedExponent) {
    throw new DecimalContractError(
      `API returned ${actualDecimalPlaces} decimal places for ${response.currency} (expected ≤${expectedExponent}). ` +
        `Fix: align the API contract or add an explicit exponent field to the response schema.`,
    );
  }
  return {
    minorUnits: toMinorUnits(response.amount, response.currency),
    currency: response.currency,
  };
};

// ─────────────────────────────────────────────────────────────
// Rule 4: Transaction State Machine
// ─────────────────────────────────────────────────────────────

// ❌ Ad-hoc string status — allows any value, no transition safety
const badStatus: string = "in-progress";

// ✅ Discriminated union; transitions enforced server-side; client reflects only
type TxStatus =
  | "INITIATED"
  | "PENDING"
  | "AUTHORIZED"
  | "PROCESSING"
  | "POSTED"
  | "FAILED"
  | "REVERSED";

// ─────────────────────────────────────────────────────────────
// Rule 6: Approved Gateways & Integrations
// ─────────────────────────────────────────────────────────────

// ❌ Calling an arbitrary host not on the allowlist
const badCall = () => fetch("https://unknown-third-party.com/api/pay");

// ✅ All outbound hosts validated against the allowlist at the API layer
// config/allowlist.ts
export const ALLOWED_API_HOSTS = [
  "api.finvault.internal",
  "payments.approvedpsp.com",
] as const;
type AllowedHost = (typeof ALLOWED_API_HOSTS)[number];

// ─────────────────────────────────────────────────────────────
// Rule 9: Testing Standards for Financial Code
// ─────────────────────────────────────────────────────────────

// ❌ Non-deterministic test — flaky on different runs
test("calculates fee", () => {
  const result = calculateFee(Date.now()); // non-deterministic input
  expect(result).toBeGreaterThan(0);
});

// ❌ Golden test missing currency decimal variants — only one currency tested
test("formats USD amount only", () => {
  expect(formatMinorUnits(150, "USD")).toBe("1.50");
});

// ✅ Golden test covering 0-decimal (JPY), 2-decimal (USD), 3-decimal (KWD)
describe("formatMinorUnits — currency decimal variants", () => {
  test.each([
    [150, "USD", "1.50"], // 2 decimal places
    [150, "JPY", "150"], // 0 decimal places
    [1500, "KWD", "1.500"], // 3 decimal places
  ])("(%i, %s) → %s", (minorUnits, currency, expected) => {
    expect(formatMinorUnits(minorUnits, currency)).toBe(expected);
  });
});

// ✅ Property-based test for rounding invariant — no precision loss mid-calculation
import * as fc from "fast-check";
test("toMinorUnits round-trips without precision loss", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.constantFrom("USD", "GBP", "EUR"),
      (minorUnits, currency) => {
        const decimal =
          minorUnits / Math.pow(10, getCurrencyExponent(currency));
        expect(toMinorUnits(decimal, currency)).toBe(minorUnits);
      },
    ),
  );
});

export {};
