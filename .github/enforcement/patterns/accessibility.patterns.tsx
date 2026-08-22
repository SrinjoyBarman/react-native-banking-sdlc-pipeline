/**
 * accessibility.patterns.tsx
 * Reference patterns for sdlc-g6-accessibility-auditor. Shows ✅ correct and ❌ violation examples.
 * DO NOT import — read-only reference file.
 */
import React from "react";
import { Pressable, Text, View, FlatList } from "react-native";
import { Icon } from "some-icon-lib";
import { colors } from "finvault/core";

// ─────────────────────────────────────────────────────────────
// Rule A1: testID on all interactive/pressable elements
// ─────────────────────────────────────────────────────────────

// ❌ Missing testID
const BadButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable onPress={onPress}>
    <Text>Submit</Text>
  </Pressable>
);

// ✅ testID present
const GoodButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable testID="submit-button" onPress={onPress}>
    <Text>Submit</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────
// Rule A2: accessibilityLabel on icon-only buttons
// ─────────────────────────────────────────────────────────────

// ❌ Icon button with no label — screen reader cannot describe it
const BadIconButton = ({ onClose }: { onClose: () => void }) => (
  <Pressable testID="close-button" onPress={onClose}>
    <Icon name="close" />
  </Pressable>
);

// ✅ accessibilityLabel provided
const GoodIconButton = ({ onClose }: { onClose: () => void }) => (
  <Pressable testID="close-button" accessibilityLabel="Close" onPress={onClose}>
    <Icon name="close" />
  </Pressable>
);

// ─────────────────────────────────────────────────────────────
// Rule A3: Dynamic Type — avoid hardcoded font sizes
// ─────────────────────────────────────────────────────────────

// ❌ Fixed font size bypasses Dynamic Type
const BadText = () => <Text style={{ fontSize: 16 }}>Label</Text>;

// ✅ Use design token (theme handles font scaling)
const GoodText = () => <Text style={styles.bodyText}>Label</Text>;
const styles = {
  bodyText: {
    /* theme token */
  },
};

// ─────────────────────────────────────────────────────────────
// Rule A4: Colours must use design tokens
// ─────────────────────────────────────────────────────────────

// ❌ Hardcoded colour (unknown contrast ratio)
const BadView = () => <View style={{ backgroundColor: "#FF5733" }} />;

// ✅ Design token (theme ensures WCAG contrast)
const GoodView = () => <View style={{ backgroundColor: colors.error }} />;

// ─────────────────────────────────────────────────────────────
// Rule A5: Touch target minimum size (44pt)
// ─────────────────────────────────────────────────────────────

// ❌ Too small — fails minimum touch target
const BadTarget = () => <Pressable style={{ width: 20, height: 20 }} />;

// ✅ Meets minimum 44pt
const GoodTarget = () => <Pressable style={{ width: 44, height: 44 }} />;

// ─────────────────────────────────────────────────────────────
// Rule A6: WCAG 2.1 AA — always use design tokens for colour
// ─────────────────────────────────────────────────────────────
// Known-safe contrast ratios are baked into the design token system.
// Any hardcoded hex/rgb colour may violate WCAG 2.1 AA (4.5:1 for text, 3:1 for UI).

// ❌ Hardcoded — unknown contrast ratio, may fail WCAG 2.1 AA
const BadContrast = () => (
  <Text style={{ color: "#9E9E9E", backgroundColor: "#FFFFFF" }}>
    Disclaimer
  </Text>
);

// ✅ Design token — contrast guaranteed by the design system
const GoodContrast = () => (
  <Text
    style={{ color: colors.textSecondary, backgroundColor: colors.surface }}
  >
    Disclaimer
  </Text>
);

// ─────────────────────────────────────────────────────────────
// Rule A7: Android keyboard navigation
// ─────────────────────────────────────────────────────────────

// ❌ Custom pressable View without accessibility role — invisible to keyboard nav
const BadKeyboardNav = ({ onPress }: { onPress: () => void }) => (
  <View onTouchEnd={onPress}>
    <Text>Tap me</Text>
  </View>
);

// ✅ accessible + accessibilityRole allows keyboard/switch navigation
const GoodKeyboardNav = ({ onPress }: { onPress: () => void }) => (
  <View
    accessible={true}
    accessibilityRole="button"
    onTouchEnd={onPress}
    testID="custom-pressable"
    accessibilityLabel="Tap me"
  >
    <Text>Tap me</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Rule A8: accessibilityHint for non-obvious interactions
// ─────────────────────────────────────────────────────────────

// ❌ Label alone doesn't communicate outcome for complex action
const BadHint = () => (
  <Pressable testID="transfer-btn" accessibilityLabel="Transfer">
    <Text>Transfer</Text>
  </Pressable>
);

// ✅ Hint clarifies what happens when the user activates the element
const GoodHint = () => (
  <Pressable
    testID="transfer-btn"
    accessibilityLabel="Transfer"
    accessibilityHint="Opens the money transfer form"
  >
    <Text>Transfer</Text>
  </Pressable>
);

export {};
