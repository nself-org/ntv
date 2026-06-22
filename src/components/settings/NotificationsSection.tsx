/**
 * Purpose: Notification preference toggles for the settings screen.
 * Inputs:
 *   - notifsSchedule: boolean — schedule notification toggle
 *   - notifsNew: boolean — new content notification toggle
 *   - onScheduleChange: (v: boolean) => void
 *   - onNewChange: (v: boolean) => void
 *   - t: translation function
 * Outputs: Section header + card with two Switch rows.
 * Constraints: RTL support. Accessible labels on each Switch.
 * SPORT: P4-E0-W2-S07-T01 settings refactor
 */

import React from 'react';
import { I18nManager, StyleSheet, Switch, Text, View } from 'react-native';
import { SettingsSectionHeader } from './SettingsSectionHeader';

interface NotificationsSectionProps {
  notifsSchedule: boolean;
  notifsNew: boolean;
  onScheduleChange: (v: boolean) => void;
  onNewChange: (v: boolean) => void;
  t: (key: string) => string;
}

/** Notification preference card with schedule + new-content toggles. */
export function NotificationsSection({
  notifsSchedule,
  notifsNew,
  onScheduleChange,
  onNewChange,
  t,
}: NotificationsSectionProps): React.ReactElement {
  return (
    <>
      <SettingsSectionHeader title={t('notifications.label')} />
      <View style={styles.card}>
        <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
          <Text style={styles.prefLabel}>{t('notifications.schedule')}</Text>
          <Switch
            value={notifsSchedule}
            onValueChange={onScheduleChange}
            trackColor={{ false: '#374151', true: '#0ea5e9' }}
            thumbColor="#ffffff"
            accessibilityLabel={t('notifications.schedule')}
          />
        </View>
        <View style={styles.fieldSep} />
        <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
          <Text style={styles.prefLabel}>{t('notifications.new')}</Text>
          <Switch
            value={notifsNew}
            onValueChange={onNewChange}
            trackColor={{ false: '#374151', true: '#0ea5e9' }}
            thumbColor="#ffffff"
            accessibilityLabel={t('notifications.new')}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#111827', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  prefRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 44,
  },
  prefRowRTL: { flexDirection: 'row-reverse' },
  prefLabel: { fontSize: 15, color: '#f9fafb', flex: 1 },
  fieldSep: { height: StyleSheet.hairlineWidth, backgroundColor: '#1f2937', marginHorizontal: 12 },
});
