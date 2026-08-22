---
description: >
  Use when: refactoring, reviewing, or creating React Native components in any feature module.
  Enforces hook extraction, component folder structure, formatting utilities, and style cleanup.
applyTo: "src/*/components/**/*.{ts,tsx}"
---

# Component Refactoring Standards

## Component Folder Structure — Always Use Named Folders

Every component lives in its own named folder. Flat files at component level are not allowed.

```
ComponentName/
  ComponentName.tsx          # Component implementation
  ComponentName.styles.ts    # StyleSheet definitions
  ComponentName.types.ts     # Props interfaces & exported types
  index.ts                   # Barrel — re-exports component and types
```

- **Never** declare props interfaces inline in the `.tsx` file — always extract to `ComponentName.types.ts`.
- `index.ts` must re-export both the component and its prop types (`export type { ... }`).

## Hook Extraction — No Logic in Components

Components must be pure rendering functions. Extract all logic to hooks in `hooks/` inside the owning feature module.

### Naming Convention

| Component Level | Hook Name Pattern          | Example                                  |
| --------------- | -------------------------- | ---------------------------------------- |
| Page / Screen   | `useXScreen`               | `DashboardScreen` → `useDashboardScreen` |
| Organism        | `useX`                     | `TransactionCard` → `useTransactionCard` |
| Molecule        | `useX` (when logic exists) | `PaymentRow` → `usePaymentRow`           |

### What Belongs in the Hook

- `useNavigation`, `useRoute`, route params
- `useCallback`, `useMemo`
- Conditional logic, boolean derivations (`isVisible`, `showButton`)
- String formatting (`displayAmount`, `formattedDate`)
- Redux selectors and dispatch calls
- Event handlers (`handlePress`, `goBack`, `onConfirm`)

### What Stays in the Component

- JSX rendering
- Destructuring the hook return
- Early returns for null/empty states (using hook-provided booleans)

### Hook Return Shape

```ts
return { derivedValue, handler, flag } as const;
```

## Formatting Utilities — Use `core`

| Task             | Utility                    | Location      |
| ---------------- | -------------------------- | ------------- |
| Currency display | `formatCurrency(amount)`   | `core/utils/` |
| Date only        | `formatShortDate(isoDate)` | `core/utils/` |
| Date + time      | `formatLongDate(isoDate)`  | `core/utils/` |

Never inline `toFixed()`, currency symbols, `Intl.DateTimeFormat`, or `toLocaleDateString`.

## Constants — No Magic Values

- Extract magic numbers (timeouts, delays, sizes, thresholds) to `constants/` in the owning feature module.
- Use `UPPER_SNAKE_CASE`: `MAX_PIN_ATTEMPTS`, `SESSION_TIMEOUT_MS`, `CARD_NUMBER_DISPLAY_LENGTH`.
- Import shared design tokens (`colors`, `spacing`, `typography`, `borderRadius`) from `core/theme/theme.ts`.

## Skeleton Loading — Prevent Flash of Empty State

- Page component conditionally renders: `isLoading ? <XSkeleton /> : <XContent />`.
- `isLoading` must be `true` for both `'idle'` and `'loading'` status.
- Do not show empty lists or placeholder text while loading — always show a skeleton.

## Primitive Extraction — Refactor Repeated JSX to Atoms

When refactoring, scan each component for repeated primitive patterns. Any primitive JSX block that appears **2 or more times** in a single file must be extracted to a named atom in `shared/components/atoms/`.

**Indicators that extraction is needed:**

- Multiple `Pressable` blocks with the same structural shape (same styles, `testID`, `accessibilityLabel` pattern)
- Multiple identical `Text` variants (same style set, same wrapper logic)
- Any button-like pattern repeated across rows (e.g., keypad buttons, action buttons, icon buttons)

**Extraction process:**

1. Identify the repeated pattern and its variable parts (label, onPress, testID, accessibilityLabel).
2. Create a new atom: `shared/components/atoms/XButton/XButton.tsx` with proper folder structure.
3. Define `XButtonProps` in `XButton.types.ts` covering all variable parts.
4. Replace every inline repetition in the original file with `<XButton ... />`.
5. Import from `finvault/shared`.

**Example — NumberPad refactor:**

```tsx
// Before: Pressable repeated 10+ times inline
// After: extract KeypadButton atom, NumberPad becomes:

import { KeypadButton } from "finvault/shared";

const row1 = ["1", "2", "3"];
// ...
{
  row1.map((digit) => (
    <KeypadButton
      key={digit}
      label={digit}
      onPress={() => onDigit(digit)}
      testID={`number-pad-${digit}`}
      accessibilityLabel={`Digit ${digit}`}
    />
  ));
}
```

## Strict Atomic Composition — Screens Must Not Use Raw RN Primitives

When refactoring a screen or organism, remove all direct usage of raw RN primitives (`View`, `Text`, `Pressable`, `Image`) from the screen/organism JSX. Replace each with a named atom or molecule.

**Refactor decision tree:**

1. Does the primitive carry only layout? → Wrap in a named layout atom (e.g., `<ScreenContainer>`, `<Card>`, `<Row>`).
2. Does the primitive display text? → Extract to a typed text atom (e.g., `<SectionTitle>`, `<BodyText>`, `<CaptionText>`).
3. Does the primitive display an image? → Extract to `<ProductImage>` or a named image atom.
4. Does the primitive handle a press? → Extract to a named button/pressable atom.

**Correct post-refactor screen shape:**

```tsx
// ProductDetailsScreen — all raw primitives replaced by named components
return (
  <ScreenContainer>
    <SectionTitle title={product.name} />
    <ProductCard
      image={product.imageUrl}
      description={product.description}
      rating={product.rating}
    />
    <RatingAndReviews reviews={reviews} />
    <ActionButton
      label="Add to Cart"
      onPress={handleAddToCart}
      testID="add-to-cart-btn"
    />
  </ScreenContainer>
);
```

## Cleanup Checklist

- [ ] Props interface extracted to `ComponentName.types.ts`.
- [ ] All logic extracted to co-located hook.
- [ ] Hook returns a flat `as const` object.
- [ ] No `useCallback`, `useMemo`, conditional logic in component body.
- [ ] `testID` added to all `Pressable`/interactive elements.
- [ ] No hardcoded user-facing strings — moved to `constants/`.
- [ ] No inline color values — tokens from `core/theme/theme.ts`.
- [ ] Magic numbers extracted to `constants/`.
- [ ] No repeated primitive JSX blocks — extracted to named atoms in `shared/components/atoms/`.
- [ ] Screen/organism JSX contains only named atoms, molecules, or organisms — no raw RN primitives.
