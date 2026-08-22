/**
 * performance.patterns.ts
 * Reference patterns for sdlc-g5-performance-auditor. Shows ✅ correct and ❌ violation examples.
 * DO NOT import — read-only reference file.
 */
import React, { useEffect } from 'react';
import { AppState, FlatList, ScrollView, StyleSheet } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Rule P1: No inline objects/functions in JSX (cause re-renders)
// ─────────────────────────────────────────────────────────────

// ❌ New object on every render
const BadComponent = () => (
  <MyComp style={{ margin: 10 }} onPress={() => doSomething()} />
);

// ✅ Stable references
const goodStyles = StyleSheet.create({ container: { margin: 10 } });
const handlePress = () => doSomething();
const GoodComponent = () => (
  <MyComp style={goodStyles.container} onPress={handlePress} />
);

// ─────────────────────────────────────────────────────────────
// Rule P2: FlatList keyExtractor must not use array index
// ─────────────────────────────────────────────────────────────

// ❌ Index as key — defeats reconciliation
const BadList = () => (
  <FlatList
    keyExtractor={(_, index) => index.toString()}
    data={[]}
    renderItem={() => null}
  />
);

// ✅ Stable unique ID
const GoodList = () => (
  <FlatList keyExtractor={item => item.id} data={[]} renderItem={() => null} />
);

// ─────────────────────────────────────────────────────────────
// Rule P3: FlatList instead of ScrollView+map for dynamic lists
// ─────────────────────────────────────────────────────────────

// ❌ map() inside ScrollView — all items rendered at once
const BadScrollList = ({ items }: { items: Item[] }) => (
  <ScrollView>
    {items.map(item => (
      <ItemCard key={item.id} item={item} />
    ))}
  </ScrollView>
);

// ✅ FlatList virtualises the list
const renderItem = ({ item }: { item: Item }) => <ItemCard item={item} />;
const GoodScrollList = ({ items }: { items: Item[] }) => (
  <FlatList
    data={items}
    keyExtractor={item => item.id}
    renderItem={renderItem}
  />
);

// ─────────────────────────────────────────────────────────────
// Rule P4: Event listeners must be cleaned up
// ─────────────────────────────────────────────────────────────

// ❌ Listener added but never removed — memory leak
const BadEffect = () => {
  useEffect(() => {
    AppState.addEventListener('change', handler);
  }, []);
  return null;
};

// ✅ Cleanup returned from useEffect
const GoodEffect = () => {
  useEffect(() => {
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);
  return null;
};

declare const MyComp: React.ComponentType<{
  style?: object;
  onPress?: () => void;
}>;
declare const ItemCard: React.ComponentType<{ item: Item }>;
declare function doSomething(): void;
declare function handler(state: string): void;
interface Item {
  id: string;
}
export {};
