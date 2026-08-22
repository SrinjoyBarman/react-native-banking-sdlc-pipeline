---
applyTo: 'src/**'
---

# Component Standards — DigitalBanking React Native

> Binding for all engineers and AI agents. Non-conforming components MUST NOT be merged.

---

## 1. Design Tokens

All visual values (color, spacing, typography, radii, shadows, motion) MUST come from `useTheme()`. Raw literals MUST NOT appear in component code.

> **Pattern:** [Rule 1 — Design Tokens](../enforcement/patterns/component-standards.patterns.tsx)

---

## 2. Atomic Design Tiers

Assign the **highest** tier that fits. Each component belongs to exactly one tier.

| Tier         | Definition                                             | MUST                                                                               | MUST NOT                                                                    |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Atom**     | Smallest indivisible UI primitive; no app state        | Presentational props only; `core` imports only; fully controlled                   | Fetch data; read Redux/MMKV; contain business logic; render >1 concept      |
| **Molecule** | Focused composition of ≥2 atoms; local UI state only   | Compose atoms; manage focus/error/masking state; reusable across organisms         | Fetch data; dispatch; navigate; import feature modules                      |
| **Organism** | Self-contained, reusable screen section                | Own data via custom hook if needed; own complex local state; emit typed callbacks  | Call `navigation.navigate` directly; span >1 feature concern                |
| **Template** | Layout skeleton; zero domain data                      | Named render-prop slots; `SafeAreaView`/`KeyboardAvoidingView`                     | Read store; import feature modules; hard-code strings; navigate             |
| **Screen**   | Navigator-mounted root; wires data + nav to a template | Own all selectors, dispatch, and `useNavigation`; map store data to organism props | Contain inlinable JSX (extract it); be reused; pass raw sensitive data down |

### Examples

**Atom** — `atoms/CurrencyText/`
**Molecule** — `molecules/AmountInput/`
**Organism** — `organisms/TransactionCard/`
**Template** — `templates/DashboardTemplate/`
**Screen** — `screens/AccountsScreen/`

> **Pattern:** [Rule 5 — Atomic Design Tiers](../enforcement/patterns/component-standards.patterns.tsx)

## 3. Dependency Direction

`atoms → nothing · molecules → atoms · organisms → atoms+molecules · templates → organisms · screens → all`
Upward or sideways imports MUST NOT occur; enforce as a **build failure** via `eslint-plugin-boundaries`:

```js
{"rule":"boundaries/element-types","config":[{"from":"atoms","disallow":["molecules","organisms","templates","screens"]},{"from":"molecules","disallow":["organisms","templates","screens"]}]}
```

## 4. State Ownership

| Layer             | Allowed state                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Atom / Molecule   | Ephemeral local UI only (focus, hover); MUST be stateless and fully controlled otherwise        |
| Organism / Screen | Local UI state only (open/close); MUST delegate data fetching and server state to a custom hook |
| Hook              | Server state, data fetching, `useSelector`, `useDispatch` — exclusively at this level           |

Component bodies MUST NOT call raw React or Redux hooks (`useState`, `useEffect`, `useSelector`, `useDispatch`, `useNavigation`) directly — all such calls MUST be encapsulated in a dedicated custom hook co-located in `use<Name>.ts`.

## 5. Component API Design

- Variants MUST use discriminated unions, NOT boolean piles: `type ButtonIntent = 'primary' | 'destructive' | 'ghost'`.
- Prefer `children`/named slots; compound components (`Card.Header`, `Card.Body`) MUST be used for sub-sectioned components.
- Prop drilling MUST NOT exceed 2 levels — use composition or scoped context. `// WRONG: <Button primary loading />  CORRECT: <Button intent="primary" state="loading" />`

## 6. JSX Decomposition

Extract when: same block ≥2 occurrences · subtree has independent state or a11y role · file exceeds tier limit · a comment is needed to explain a block.
**Limits:** Atom ≤80 · Molecule ≤150 · Organism ≤250 · Template ≤120 · Screen ≤150 lines. Components with >8 props SHOULD be decomposed.

> **Pattern:** [Rule 6 — JSX Decomposition](../enforcement/patterns/component-standards.patterns.tsx)

## 7. Promotion & Deprecation

- **Rule of three:** used in ≥3 features MUST be promoted to `src/shared/components/<tier>/`.
- Deprecated components MUST be marked `@deprecated` in JSDoc and removed within one sprint.
- Components MUST be designed and structured for reuse from the start (clean props API, no embedded feature assumptions) — but MUST NOT be promoted to `shared` until the Rule of Three is met.

## 8. Mandatory States

Every organism and screen MUST implement `loading | empty | error`; loading MUST use skeleton atoms — never a blank view:

> **Pattern:** [Rule 7 — Mandatory States](../enforcement/patterns/component-standards.patterns.tsx)

## 9. Forms Architecture

- Zod/yup schema MUST live at form-organism level; field atoms MUST NOT contain validation.
- Field molecules are fully controlled (`value`, `onChange`, `onBlur`, `error` props).

## 10. Security at the Component Layer

- PIN/password inputs MUST use `secureTextEntry`. Sensitive-screen templates MUST call `useSensitiveScreen()`.

## 11. Performance Discipline

- **No inline styles:** `style={{ ... }}` MUST NOT appear in any JSX. All styles MUST be defined in `<Name>.styles.ts` via `StyleSheet.create` and imported into the component.
- Lists MUST use the shared list wrapper components from `shared` — `FlatList`/`FlashList` MUST NOT be used directly in feature code; `.map()` inside `ScrollView` MUST NOT be used.
- Inline objects/functions in JSX props on hot-path components MUST NOT appear — use `useCallback`, `useMemo`, `StyleSheet.create`.
- List item keys MUST be stable entity IDs; index keys MUST NOT be used.

## 12. Accessibility & i18n

- Every interactive element MUST have `accessibilityLabel` (i18n-resolved), `accessibilityRole`, `accessibilityState`; touch targets ≥48×48 dp; MUST support `allowFontScaling` and RTL.
- All strings MUST use `t(key)`; no hardcoded strings in JSX.

## 13. File & Folder Structure

`src/<feature>/components/<tier>/<Name>/` → `<Name>.tsx · .styles.ts · .types.ts · .test.tsx · index.ts`
`src/<feature>/screens/<Name>/<Name>.tsx · .test.tsx · index.ts`
Dirs/files `PascalCase`. Hooks `use<Domain><Action>.ts`. Barrels re-export only; MUST NOT contain logic or create deep chains.

Each file in a component folder has a strict single responsibility:

- `<Name>.types.ts` — `interface <Name>Props` and all types; MUST NOT be declared inline in `.tsx`.
- `<Name>.styles.ts` — all `StyleSheet.create` / `createStyles` calls; MUST NOT contain inline style objects in `.tsx`.
- `use<Name>.ts` — all hook logic; component `.tsx` MUST import and consume, never call raw hooks directly.

## 14. Anti-Patterns (MUST NOT)

Business logic in atoms/molecules · fetching below screen/hook level · prop drilling >2 levels · raw literals instead of tokens · inline style objects (`style={{ ... }}`) anywhere in JSX · `.map()` in `ScrollView` · using `FlatList`/`FlashList` directly instead of shared list wrappers from `shared` · index keys on lists · copy-paste instead of extraction · skipping atomic decomposition because a component is used only once · promoting to `shared` before the Rule of Three is met.

## 16. Definition of Done

- [ ] Correct tier, folder, and naming.
- [ ] All visual values from `useTheme()` — no raw literals.
- [ ] `interface <Name>Props` declared in `<Name>.types.ts`; no `any`; explicit `React.ReactElement` return type.
- [ ] All hook logic (`useState`, `useEffect`, `useSelector`, `useDispatch`, `useNavigation`) encapsulated in `use<Name>.ts`; component body calls only the custom hook.
- [ ] Loading, empty, and error states implemented (organisms + screens).
- [ ] `secureTextEntry` on PIN/password inputs; `useSensitiveScreen()` on sensitive-screen templates.
- [ ] All strings via `t(key)`.
- [ ] `accessibilityLabel`, role, and state on all interactive elements; ≥48 dp touch target.
- [ ] Styles in `<Name>.styles.ts`; no inline style objects in JSX.
- [ ] Lists use shared list wrapper components from `shared`; no direct `FlatList`/`FlashList` or `.map()` in `ScrollView`.
- [ ] Tests cover render, interactions, and mandatory states.
- [ ] `yarn lint` and `yarn tsc --noEmit` exit 0; barrel `index.ts` updated.
