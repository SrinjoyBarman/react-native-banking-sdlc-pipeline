/**
 * component-standards.patterns.ts
 * Reference patterns for component-standards.instructions.md. Shows ✅ correct and ❌ violation
 * examples for each FinVault component standard rule. Used by agents to recognise violations
 * during code review and generation.
 * DO NOT import — read-only reference file.
 */

// ─────────────────────────────────────────────────────────────
// Rule 1: Design Tokens — no raw literals in component code
// ─────────────────────────────────────────────────────────────

// ❌ Raw colour and spacing literals directly in JSX
const BadTokens = () => (
  <View style={{ padding: 12, backgroundColor: "#0A66FF" }} />
);

// ✅ All visual values from useTheme(); applied via .styles.ts
const { spacing, colors } = useTheme();
const styles = createStyles({ spacing, colors });
const GoodTokens = () => <View style={styles.container} />;

// ─────────────────────────────────────────────────────────────
// Rule 2: No inline styles — style={{ ... }} banned in JSX
// ─────────────────────────────────────────────────────────────

// ❌ Inline style object on a hot-path component
const BadInlineStyle = () => (
  <View style={{ flex: 1, marginTop: 16, backgroundColor: colors.surface }} />
);

// ✅ Styles declared in ComponentName.styles.ts and imported
// ComponentName.styles.ts
export const createComponentStyles = (colors: Colors) =>
  StyleSheet.create({
    root: { flex: 1, marginTop: spacing.md, backgroundColor: colors.surface },
  });
// ComponentName.tsx
const GoodStyle = () => <View style={styles.root} />;

// ─────────────────────────────────────────────────────────────
// Rule 3: Props interface in <Name>.types.ts — not inline
// ─────────────────────────────────────────────────────────────

// ❌ Interface declared inline in the .tsx file
interface BadProps {
  title: string;
}
const BadComponent = ({ title }: BadProps): React.ReactElement => (
  <Text>{title}</Text>
);

// ✅ Interface lives in ComponentName.types.ts; imported with `import type`
// ComponentName.types.ts
export interface ComponentNameProps {
  title: string;
  onPress: () => void;
}
// ComponentName.tsx
import type { ComponentNameProps } from "./ComponentName.types";
const GoodComponent: React.FC<ComponentNameProps> = ({
  title,
  onPress,
}): React.ReactElement => (
  <TouchableOpacity testID="component-name-cta" onPress={onPress}>
    <Text testID="component-name-title">{title}</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// Rule 4: Hooks pattern — no raw hooks in component bodies
// ─────────────────────────────────────────────────────────────

// ❌ Raw useState / useSelector / useNavigation called directly in component
const BadScreen = (): React.ReactElement => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const data = useSelector(selectData);
  return <View />;
};

// ✅ All hook logic encapsulated in use<Name>.ts; component consumes only the result
// useAccountsScreen.ts
export const useAccountsScreen = () => {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { transactions, isRefreshing } = useSelector(selectTransactions);
  return {
    transactions,
    isRefreshing,
    onRefresh: () => dispatch(fetchTransactions()),
    onTransactionPress: (id: string) =>
      navigation.navigate("TransactionDetail", { transactionId: id }),
  };
};
// AccountsScreen.tsx
const GoodScreen: React.FC = (): React.ReactElement => {
  const { transactions, isRefreshing, onRefresh, onTransactionPress } =
    useAccountsScreen();
  return (
    <ListScreenTemplate
      data={transactions}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => (
        <TransactionCard transaction={item} onPress={onTransactionPress} />
      )}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Rule 5: Atomic Design Tiers
// ─────────────────────────────────────────────────────────────

// ❌ Atom dispatching or reading store
const BadAtom = (): React.ReactElement => {
  const dispatch = useDispatch();
  return (
    <TouchableOpacity onPress={() => dispatch(someAction())}>
      <Text>X</Text>
    </TouchableOpacity>
  );
};

// ✅ Atom — purely presentational; core imports only; fully controlled
// CurrencyText.types.ts
export interface CurrencyTextProps {
  amountMinorUnits: number;
  currencyCode: string;
  accessibilityLabel: string;
}
// CurrencyText.tsx
import type { CurrencyTextProps } from "./CurrencyText.types";
const CurrencyText: React.FC<CurrencyTextProps> = ({
  amountMinorUnits,
  currencyCode,
  accessibilityLabel,
}): React.ReactElement => (
  <Text style={styles.amount} accessibilityLabel={accessibilityLabel}>
    {formatMinorUnits(amountMinorUnits, currencyCode)}
  </Text>
);

// ✅ Molecule — composes atoms; focus state encapsulated in dedicated hook
// useAmountInput.ts
export const useAmountInput = () => {
  const [isFocused, setIsFocused] = useState(false);
  return {
    isFocused,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
};
// AmountInput.tsx
const AmountInput: React.FC<AmountInputProps> = ({
  amountMinorUnits,
  currencyCode,
  onChangeAmount,
  accessibilityLabel,
}): React.ReactElement => {
  const { colors } = useTheme();
  const { isFocused, onFocus, onBlur } = useAmountInput();
  return (
    <View style={[styles.container, isFocused && focusedStyle(colors)]}>
      <TextInput
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={accessibilityLabel}
      />
      <CurrencyText
        amountMinorUnits={amountMinorUnits}
        currencyCode={currencyCode}
        accessibilityLabel={t("amount_input.formatted_a11y")}
      />
    </View>
  );
};

// ✅ Organism — owns domain data via hook; navigation delegated via callback prop
const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
}): React.ReactElement => (
  <TouchableOpacity
    onPress={() => onPress(transaction.id)}
    accessibilityRole="button"
    accessibilityLabel={t("transaction_card.a11y", { ...transaction })}
  >
    <CurrencyText
      amountMinorUnits={transaction.amountMinorUnits}
      currencyCode={transaction.currencyCode}
      accessibilityLabel={t("transaction_card.amount_a11y")}
    />
  </TouchableOpacity>
);

// ✅ Template — named render-prop slots; zero domain data; layout only
const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  header,
  quickActions,
  transactionList,
}): React.ReactElement => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.root}>
      <ScrollContainer contentContainerStyle={styles.scroll}>
        {header}
        {quickActions}
        {transactionList}
      </ScrollContainer>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// Rule 6: JSX Decomposition — extract repeated / role-owning subtrees
// ─────────────────────────────────────────────────────────────

// ❌ Same subtree duplicated inline; no independent a11y role
const BadList = ({ items }: { items: Transaction[] }): React.ReactElement => (
  <View>
    <View accessibilityRole="header">
      <Badge
        variant="info"
        labelKey="transactions.recent"
        accessibilityLabel={t("transactions.recent")}
      />
    </View>
    <VerticalList
      data={items}
      keyExtractor={(tx) => tx.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("tx.a11y", { ...item })}
        >
          <CurrencyText
            amountMinorUnits={item.amountMinorUnits}
            currencyCode={item.currencyCode}
            accessibilityLabel={t("tx.amount")}
          />
        </TouchableOpacity>
      )}
    />
    <View accessibilityRole="footer">
      <Badge
        variant="info"
        labelKey="transactions.all"
        accessibilityLabel={t("transactions.all")}
      />
    </View>
  </View>
);

// ✅ Repeated block extracted; each subtree owns its a11y role
const SectionBadge: React.FC<SectionBadgeProps> = ({
  variant,
  labelKey,
}): React.ReactElement => (
  <View accessibilityRole="header">
    <Badge
      variant={variant}
      labelKey={labelKey}
      accessibilityLabel={t(labelKey)}
    />
  </View>
);
const GoodList = ({ items }: { items: Transaction[] }): React.ReactElement => (
  <View>
    <SectionBadge variant="info" labelKey="transactions.recent" />
    <VerticalList
      data={items}
      keyExtractor={(tx) => tx.id}
      renderItem={({ item }) => (
        <TransactionCard transaction={item} onPress={onPress} />
      )}
    />
    <SectionBadge variant="info" labelKey="transactions.all" />
  </View>
);

// ─────────────────────────────────────────────────────────────
// Rule 7: Mandatory States — loading | empty | error required
// ─────────────────────────────────────────────────────────────

// ❌ No loading or error handling — blank screen on fetch
const BadOrganism = ({
  items,
}: {
  items: Transaction[];
}): React.ReactElement => (
  <VerticalList
    data={items}
    keyExtractor={(tx) => tx.id}
    renderItem={({ item }) => (
      <TransactionCard transaction={item} onPress={onPress} />
    )}
  />
);

// ✅ All three states guarded before render
const GoodOrganism = ({
  items,
  isLoading,
  error,
  onRefresh,
}: TransactionListProps): React.ReactElement => {
  if (isLoading) return <TransactionListSkeleton />;
  if (error) return <ErrorBanner onRetry={onRefresh} />;
  if (!items.length) return <EmptyState labelKey="transactions.empty" />;
  return (
    <VerticalList
      data={items}
      keyExtractor={(tx) => tx.id}
      renderItem={({ item }) => (
        <TransactionCard transaction={item} onPress={onPress} />
      )}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Rule 8: Lists — use shared wrappers; no direct FlatList / .map()
// ─────────────────────────────────────────────────────────────

// ❌ .map() inside ScrollView
const BadMap = ({ items }: { items: Transaction[] }): React.ReactElement => (
  <ScrollView>
    {items.map((item) => (
      <TransactionCard key={item.id} transaction={item} onPress={onPress} />
    ))}
  </ScrollView>
);

// ❌ Direct FlatList usage in feature code
const BadFlatList = ({
  items,
}: {
  items: Transaction[];
}): React.ReactElement => (
  <FlatList
    data={items}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <TransactionCard transaction={item} onPress={onPress} />
    )}
  />
);

// ✅ Shared list wrapper from shared
const GoodListUsage = ({
  items,
}: {
  items: Transaction[];
}): React.ReactElement => (
  <VerticalList
    data={items}
    keyExtractor={(tx) => tx.id}
    renderItem={({ item }) => (
      <TransactionCard transaction={item} onPress={onPress} />
    )}
  />
);

export {};
