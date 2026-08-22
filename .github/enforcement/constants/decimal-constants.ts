/**
 * decimal-constants.ts
 * Canonical source of truth for currency minor-unit exponents (decimal places).
 * Import this wherever currency precision is needed — never hardcode decimal counts.
 * Referenced by: banking-standards.patterns.ts, banking-standards.instructions.md
 */

/** ISO 4217 minor-unit exponents: the number of decimal places for each currency. */
export const CURRENCY_EXPONENTS: Readonly<Record<string, number>> = {
  // Zero decimal places
  JPY: 0, KRW: 0, VND: 0, CLP: 0, ISK: 0,

  // Two decimal places (most common)
  USD: 2, GBP: 2, EUR: 2, AUD: 2, CAD: 2, CHF: 2, SGD: 2, HKD: 2,
  NZD: 2, NOK: 2, SEK: 2, DKK: 2, ZAR: 2, INR: 2, MXN: 2, BRL: 2,

  // Three decimal places
  KWD: 3, BHD: 3, OMR: 3, JOD: 3, TND: 3,
} as const;

/** Returns the minor-unit exponent for a given currency code.
 *  Throws if the currency is not in the approved list. */
export const getCurrencyExponent = (currency: string): number => {
  const exponent = CURRENCY_EXPONENTS[currency];
  if (exponent === undefined) {
    throw new Error(
      `Unknown currency "${currency}". Add it to enforcement/constants/decimal-constants.ts before use.`
    );
  }
  return exponent;
};

/** Converts a decimal API value to integer minor units using the canonical exponent. */
export const toMinorUnits = (value: number, currency: string): number => {
  const exponent = getCurrencyExponent(currency);
  return Math.round(value * Math.pow(10, exponent));
};
