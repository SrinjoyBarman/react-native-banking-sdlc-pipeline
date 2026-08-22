---
description: >
  Use when: creating or modifying React Native components, screens, atoms, molecules,
  or organisms. Enforces component syntax, prop patterns, folder structure, and
  logic extraction rules. Core standards that apply to all components.
applyTo: "src/**/components/**/*.{ts,tsx}"
---

# Component Standards

## Component Syntax

All components use **typed arrow function syntax** with `React.FC<Props>` — **never** the `function` keyword.

```tsx
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  // Implementation
};
```

- Props declared as a **separate named interface** above the component
- Destructure props in the function signature, not in the body
- Interface name pattern: `{ComponentName}Props`

## Logic-Free Components

All logic extracted to a co-located hook:

- **Pages** → `useXScreen` hook (e.g., `DashboardScreen` → `useDashboardScreen`)
- **Organisms** → `useX` hook (e.g., `TransactionCard` → `useTransactionCard`)
- Hooks live in `hooks/` inside the owning feature module
- Hook returns a flat object with `as const`
- **No** `useCallback`, `useMemo`, conditional logic, or string formatting in component bodies
- Navigation logic (`useNavigation`, `useRoute`) belongs in hooks, not components

## Atomic Design Pattern

All components organized using atomic design methodology within `components/` folder:

```
components/
  atoms/              # Basic building blocks (buttons, inputs, icons, text)
  molecules/          # Simple combinations of atoms (form fields, cards)
  organisms/          # Complex components (forms, navigation bars, lists)
  templates/          # Page-level layouts without data (optional)
```

**Classification Rules:**

- **Atoms** — Indivisible UI primitives: Button, Input, Icon, Label, Dot, Circle
- **Molecules** — 2-3 atoms combined: NumberPad (buttons + layout), MPINInput (circles + container)
- **Organisms** — Complex multi-part components: TransactionCard, AccountSummary, FilterPanel
- **Templates** — Layout structures (rare in RN; most layouts are in screens/)

**When in doubt:** Start at atom level; promote to molecule/organism only if component combines multiple distinct parts.

## Primitive Reuse — No Repeated Inline Primitives

**Rule:** If the same primitive JSX pattern appears more than once inside a single component, it MUST be extracted to a named atom in `shared/components/atoms/` and imported from there.

This applies to any repeated `Pressable`, `Text` variant, `View` container, or touchable pattern that carries style, `testID`, and `accessibilityLabel` together.

### Example — Violation

```tsx
// ❌ Wrong — KeypadButton JSX duplicated for every digit row
export const NumberPad: React.FC<NumberPadProps> = ({ onDigit }) => (
  <View>
    <View style={styles.row}>
      <Pressable
        style={styles.button}
        onPress={() => onDigit("1")}
        testID="number-pad-1"
        accessibilityLabel="Digit 1"
      >
        <Text style={styles.buttonText}>1</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => onDigit("2")}
        testID="number-pad-2"
        accessibilityLabel="Digit 2"
      >
        <Text style={styles.buttonText}>2</Text>
      </Pressable>
      {/* ...repeated for every digit */}
    </View>
  </View>
);
```

### Example — Correct

```tsx
// ✅ Correct — extract the repeated Pressable to a KeypadButton atom
// shared/components/atoms/KeypadButton/KeypadButton.tsx
export const KeypadButton: React.FC<KeypadButtonProps> = ({
  label,
  onPress,
  testID,
  accessibilityLabel,
}) => (
  <Pressable
    style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    onPress={onPress}
    testID={testID}
    accessibilityLabel={accessibilityLabel}
  >
    {({ pressed }) => (
      <Text style={[styles.buttonText, pressed && styles.buttonTextPressed]}>
        {label}
      </Text>
    )}
  </Pressable>
);

// shared/components/molecules/NumberPad/NumberPad.tsx
import { KeypadButton } from "finvault/shared";

export const NumberPad: React.FC<NumberPadProps> = ({ onDigit }) => (
  <View>
    {["1", "2", "3"].map((digit) => (
      <KeypadButton
        key={digit}
        label={digit}
        onPress={() => onDigit(digit)}
        testID={`number-pad-${digit}`}
        accessibilityLabel={`Digit ${digit}`}
      />
    ))}
  </View>
);
```

**Threshold:** 2 or more identical primitive patterns in one file → extract to atom.

## Strict Atomic Composition — Screens and Organisms

Screens and organisms must be composed exclusively of named atoms, molecules, and organisms from `shared` or the owning feature module. **Raw RN primitives (`View`, `Text`, `Pressable`, `Image`) are not allowed directly in screen or organism JSX** — they belong inside atoms.

### Composition Hierarchy

```
Screen / Page
  └── Organisms (from shared or owning feature module)
        └── Molecules (from shared or owning feature module)
              └── Atoms (from shared)
                    └── RN primitives (View, Text, Pressable, Image, etc.)
```

### Example — Correct Screen Composition

```tsx
// ✅ ProductDetailsScreen — composed of named organisms/molecules/atoms only
export const ProductDetailsScreen: React.FC = () => {
  const { product, reviews, isLoading } = useProductDetailsScreen();

  if (isLoading) return <ProductDetailsSkeleton />;

  return (
    <ScreenContainer>
      <SectionTitle title={product.name} />          {/* atom from shared */}
      <ProductCard
        image={product.imageUrl}                      {/* organism from shared */}
        description={product.description}
        rating={product.rating}
        reviews={reviews}
      />
      <RatingAndReviews reviews={reviews} />          {/* molecule from shared */}
    </ScreenContainer>
  );
};

// ✅ ProductCard — organism, composed of molecules/atoms, no raw RN primitives
export const ProductCard: React.FC<ProductCardProps> = ({ image, description, rating }) => (
  <Card>                                               {/* molecule from shared */}
    <ProductImage source={image} />                    {/* atom */}
    <ProductDescription text={description} />          {/* atom */}
    <StarRating value={rating} />                      {/* atom */}
  </Card>
);
```

```tsx
// ❌ Wrong — screen contains raw RN primitives and inline layout
export const ProductDetailsScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>{product.name}</Text>
    <Image source={{ uri: product.imageUrl }} style={styles.image} />
    <Text style={styles.description}>{product.description}</Text>
  </View>
);
```

**Enforcement rule:** If a screen or organism JSX contains a raw RN primitive (`View`, `Text`, `Pressable`, `Image`, `ScrollView`, `FlatList`) directly, without it being wrapped in a named atom, it is a violation.

**Exception:** `FlatList`/`ScrollView` may appear at the organism level as layout containers — but only once per component, as the root layout wrapper.

## Component Folder Structure

Every component (atom, molecule, organism, screen) lives in its own named folder:

```
ComponentName/
  ComponentName.tsx          # Component implementation
  ComponentName.styles.ts    # StyleSheet definitions
  ComponentName.types.ts     # Props interfaces & exported types
  index.ts                   # Barrel — re-exports component and types
```

**Rules:**

- **Never** declare props inline in the `.tsx` file — always extract to `ComponentName.types.ts`
- `index.ts` must re-export both the component and its prop types
- Flat files at component level are **not allowed**

## Example Structure

```tsx
// TransactionCard/TransactionCard.types.ts
export interface TransactionCardProps {
  amount: number;
  description: string;
  onPress: () => void;
}

// TransactionCard/TransactionCard.tsx
import type { TransactionCardProps } from "./TransactionCard.types";
import { styles } from "./TransactionCard.styles";

export const TransactionCard: React.FC<TransactionCardProps> = ({
  amount,
  description,
  onPress,
}) => {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      testID="transaction-card"
    >
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.amount}>{amount}</Text>
    </Pressable>
  );
};

// TransactionCard/index.ts
export { TransactionCard } from "./TransactionCard";
export type { TransactionCardProps } from "./TransactionCard.types";
```

## Design Tokens in Component Styles

All `ComponentName.styles.ts` files must use design tokens from `core/theme/theme.ts` — **never hardcode hex values**.

```ts
import { colors, spacing } from 'finvault/core';

// ✅ Correct
container: { backgroundColor: colors.backgroundLogin, borderColor: colors.borderMedium }

// ❌ Wrong
container: { backgroundColor: '#0D1B2A', borderColor: '#3A4A5C' }
```

**When a design spec references a hex colour not yet in `theme.ts`, add the token to `theme.ts` first**, then reference it by name. Never implement a one-off hex value directly in a styles file.

**Key colour tokens:**

| Token                    | Usage                              |
| ------------------------ | ---------------------------------- |
| `colors.primary`         | Brand primary action               |
| `colors.backgroundLogin` | Auth / login screen background     |
| `colors.borderMedium`    | Medium-weight borders and dividers |
| `colors.white`           | White surfaces                     |
| `colors.error`           | Error and validation states        |

If a required token is missing, open `src/core/theme/theme.ts`, add it under the appropriate group, and commit it alongside the feature implementation.

```

```
