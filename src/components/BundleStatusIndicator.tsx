/**
 * Bundle Status Indicator Component
 *
 * Purpose:
 * Display bundle status in Settings screen. Shows either:
 * - "ɳTV Bundle Active" (green check badge) when bundle is active
 * - "Get ɳTV Bundle — $0.99/mo" link when bundle is inactive
 *
 * Inputs:
 * - isBundle: boolean from useIap or NSELF_BUNDLE env var
 * - onTapUpgrade?: callback for upgrade link press
 *
 * Outputs:
 * - Active state: check circle badge
 * - Inactive state: lock icon + upgrade CTA
 *
 * Constraints:
 * - Rendered only in free variant (NSELF_BUNDLE=false)
 * - Bundle variant hides this component entirely
 * - Accessibility labels required per WCAG 2.1 AA
 *
 * Ported from:
 * - ntv/flutter-archive/lib/shared/widgets/bundle_status_indicator.dart
 * - Updated in T11 flavor system
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BundleStatusIndicatorProps {
  isBundle: boolean;
  onTapUpgrade?: () => void;
}

/**
 * Status indicator showing bundle active or upgrade CTA.
 * Displayed in Settings screen.
 */
export function BundleStatusIndicator({
  isBundle,
  onTapUpgrade,
}: BundleStatusIndicatorProps) {
  if (isBundle) {
    return (
      <View style={styles.activeContainer} accessible>
        <MaterialCommunityIcons
          name="check-circle"
          size={18}
          color="#10B981" // emerald-500
          style={styles.icon}
        />
        <Text
          style={styles.activeLabel}
          accessibilityLabel="ɳTV Bundle active"
        >
          ɳTV Bundle Active
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.inactiveContainer}
      onPress={() => {
        if (onTapUpgrade) {
          onTapUpgrade();
        } else {
          // Fallback to web store if no callback provided
          Linking.openURL('https://nself.org/bundles/ntv');
        }
      }}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Get ɳTV Bundle for 99 cents per month"
      accessibilityHint="Opens bundle purchase options"
    >
      <MaterialCommunityIcons
        name="lock-outline"
        size={18}
        color="#9CA3AF" // gray-400
        style={styles.icon}
      />
      <Text style={styles.inactiveLabel}>
        Get ɳTV Bundle — $0.99/mo
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // emerald-500 at 10% opacity
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B981', // emerald-500
  },
  inactiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.1)', // gray-400 at 10% opacity
    borderRadius: 20,
  },
  icon: {
    marginRight: 8,
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  inactiveLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB', // gray-300
  },
});
