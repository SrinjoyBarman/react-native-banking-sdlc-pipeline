/**
 * framework-rules.patterns.ts
 * Reference patterns for sdlc-g2.3-framework-rules. Shows ✅ correct and ❌ violation examples
 * for each FinVault framework rule. Used by the agent to recognise violations during audit.
 * DO NOT import — read-only reference file.
 */

// ─────────────────────────────────────────────────────────────
// Rule 1: Module Boundaries
// ─────────────────────────────────────────────────────────────

// ❌ Deep relative import across module boundary
import { useBiometric } from '../../auth/native/useBiometric';

// ✅ Import from public barrel only
import { useBiometric } from 'finvault/auth';

// ─────────────────────────────────────────────────────────────
// Rule 2: Component Arrow Function Syntax
// ─────────────────────────────────────────────────────────────

// ❌ function keyword
function MyComponent({ title }: MyComponentProps) {
  return null;
}

// ❌ Missing testID on interactive element
const Bad1 = () => (
  <TouchableOpacity onPress={() => {}}>
    <Text>Submit</Text>
  </TouchableOpacity>
);

// ❌ Hardcoded user-facing string
const Bad2 = () => <Text>Welcome to FinVault</Text>;

// ✅ Correct component
interface MyComponentProps {
  title: string;
  onPress: () => void;
}
export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => (
  <TouchableOpacity testID="my-component-cta" onPress={onPress}>
    <Text testID="my-component-title">{title}</Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// Rule 3: Component Folder Structure
// ─────────────────────────────────────────────────────────────

// ❌ Flat file at component level
// src/payments/components/QRPaymentCard.tsx

// ✅ Named folder with all four files
// src/payments/components/QRPaymentCard/
//   QRPaymentCard.tsx
//   QRPaymentCard.styles.ts
//   QRPaymentCard.types.ts
//   index.ts

// ─────────────────────────────────────────────────────────────
// Rule 4: Import Aliases
// ─────────────────────────────────────────────────────────────

// ❌ Deep relative path
import { colors as badColors } from '../../../../core/theme/theme';

// ✅ Alias import
import { colors } from 'finvault/core';

// ─────────────────────────────────────────────────────────────
// Rule 5: State Management — No direct API calls in hooks
// ─────────────────────────────────────────────────────────────

// ❌ Direct API call in hook (bypasses saga)
const useBadPayment = () => {
  useEffect(() => {
    axios.get('/api/payment').then(setData);
  }, []);
};

// ✅ Dispatch saga action only
const useGoodPayment = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchPaymentData());
  }, [dispatch]);
};

// ─────────────────────────────────────────────────────────────
// Rule 6: UI Rules
// ─────────────────────────────────────────────────────────────

// ❌ Dynamic (hardcoded) colour
const BadView1 = () => <View style={{ backgroundColor: '#3498db' }} />;

// ❌ map() inside ScrollView for dynamic-length list
const BadList = ({ items }: { items: Item[] }) => (
  <ScrollView>
    {items.map((item, i) => (
      <Item key={i} data={item} />
    ))}
  </ScrollView>
);

// ✅ Design token colour
const GoodView1 = () => <View style={{ backgroundColor: colors.primary }} />;

// ✅ FlatList with stable keyExtractor
const GoodList = ({ items }: { items: Item[] }) => (
  <FlatList
    data={items}
    keyExtractor={item => item.id}
    renderItem={renderItem}
  />
);

// ─────────────────────────────────────────────────────────────
// Rule 7: isLoading must include 'idle'
// ─────────────────────────────────────────────────────────────

// ❌ Missing 'idle' — causes flash of empty state
const isLoadingBad = status === 'loading';

// ✅ Includes 'idle'
const isLoadingGood = status === 'idle' || status === 'loading';

export {};
