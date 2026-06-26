/**
 * Purpose: Settings screen section header — uppercase label with consistent spacing.
 * Inputs:  title string
 * Outputs: Styled Text element with RTL support.
 * Constraints: WCAG 2.1 AA contrast (#9ca3af on #030712 ~7:1).
 * SPORT: P4-E0-W2-S07-T01 settings refactor
 */

import React from 'react';
import { I18nManager, StyleSheet, Text } from 'react-native';

interface SettingsSectionHeaderProps {
  title: string;
}

/** Uppercase section header for the settings screen. */
export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps): React.ReactElement {
  return (
    <Text style={[styles.sectionHeader, I18nManager.isRTL && styles.textRTL]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
  },
  textRTL: {
    textAlign: 'right',
  },
});
