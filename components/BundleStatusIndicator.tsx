/**
 * Purpose: Displays bundle status badge and upsell link.
 *
 * Behavior:
 *   - if isBundle === true: show "ɳTV Bundle Active" green badge
 *   - if isBundle === false: show "Get ɳTV" upgrade link + badge
 *
 * Inputs:
 *   - isBundle: boolean — from useNtvBundle() or license store
 *   - onUpsellingTap?: () => void — called when user taps upgrade link (optional)
 *
 * Outputs:
 *   - Indicator badge component
 *
 * Constraints:
 *   - Single-responsibility: render only, no state management.
 *   - Used in screen headers and footer areas.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type BundleStatusIndicatorProps = {
  isBundle: boolean;
  onUpsellingTap?: () => void;
};

export function BundleStatusIndicator({
  isBundle,
  onUpsellingTap,
}: BundleStatusIndicatorProps) {
  if (isBundle) {
    return (
      <View style={styles.activeBadge}>
        <Text style={styles.activeBadgeText}>ɳTV Bundle Active</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.inactiveBadge}
      onPress={onUpsellingTap}
      disabled={!onUpsellingTap}
    >
      <Text style={styles.inactiveBadgeText}>Get ɳTV</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
