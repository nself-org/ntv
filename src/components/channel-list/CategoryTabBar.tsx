/**
 * Purpose: Horizontal scrollable tab bar for filtering the ɳTV channel list by category.
 * Inputs:  categories (string[]), activeCategory (string | null), onSelect callback.
 * Outputs: Horizontal ScrollView with "All" tab + one tab per category.
 * Constraints:
 *   - accessibilityRole="tablist" on the container; each item is "tab".
 *   - Max height 44pt; horizontal scrolling only; no vertical scroll.
 *   - "All" tab (null category) always first.
 * SPORT: F12-REPO-TYPE-MAP.md — ntv category-tab-bar
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { CHANNEL_LIST_COLORS as C } from './ChannelListColors';

export interface CategoryTabBarProps {
  /** Ordered list of category names to display as tabs. */
  categories: string[];
  /** Currently selected category, or null for "All". */
  activeCategory: string | null;
  /** Called with the selected category string, or null for "All". */
  onSelect: (cat: string | null) => void;
}

/**
 * Horizontal tab bar that filters the channel list by category.
 * Always renders an "All" tab first. Falls back to "Uncategorized" for blank category names.
 */
export function CategoryTabBar({ categories, activeCategory, onSelect }: CategoryTabBarProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabBar}
      contentContainerStyle={styles.tabBarContent}
      accessibilityRole="tablist"
    >
      <Pressable
        style={[styles.tab, activeCategory === null && styles.tabActive]}
        onPress={() => onSelect(null)}
        accessible
        accessibilityRole="tab"
        accessibilityLabel="All categories"
        accessibilityState={{ selected: activeCategory === null }}
      >
        <Text style={[styles.tabText, activeCategory === null && styles.tabTextActive]}>
          All
        </Text>
      </Pressable>

      {categories.map((cat) => (
        <Pressable
          key={cat}
          style={[styles.tab, activeCategory === cat && styles.tabActive]}
          onPress={() => onSelect(cat)}
          accessible
          accessibilityRole="tab"
          accessibilityLabel={cat}
          accessibilityState={{ selected: activeCategory === cat }}
        >
          <Text
            style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}
            numberOfLines={1}
          >
            {cat || 'Uncategorized'}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabBar: { maxHeight: 44, flexShrink: 0 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
});
