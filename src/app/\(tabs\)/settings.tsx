/**
 * Purpose: Settings screen — M3U source URL, playback quality, auth status, notification preferences.
 * Inputs:  Current settings from store (stub) and notification preferences from hook.
 * Outputs: Settings form with toggles for notification types.
 * Constraints: M3U URL config and auth wired in T03. Notification prefs persist via SecureStore.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T07
 */

import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '@/hooks/useNotifications';

export default function SettingsScreen(): React.ReactElement {
  const { preferences, setPreferences } = useNotifications();

  const handleToggleRecordingReminder = async (value: boolean) => {
    try {
      await setPreferences({
        ...preferences,
        recording_reminder: value,
      });
    } catch (e) {
      console.error('[SettingsScreen] Failed to save recording_reminder preference:', e);
    }
  };

  const handleToggleLiveEventAlert = async (value: boolean) => {
    try {
      await setPreferences({
        ...preferences,
        live_event_alert: value,
      });
    } catch (e) {
      console.error('[SettingsScreen] Failed to save live_event_alert preference:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>IPTV Source</Text>
        <Text style={styles.value}>Not configured — set in T03</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>Not signed in — auth wired in T03</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Recording Reminders</Text>
          <Switch
            value={preferences.recording_reminder}
            onValueChange={handleToggleRecordingReminder}
            trackColor={{ false: '#374151', true: '#10b981' }}
            thumbColor={preferences.recording_reminder ? '#059669' : '#6b7280'}
          />
        </View>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Live Event Alerts</Text>
          <Switch
            value={preferences.live_event_alert}
            onValueChange={handleToggleLiveEventAlert}
            trackColor={{ false: '#374151', true: '#10b981' }}
            thumbColor={preferences.live_event_alert ? '#059669' : '#6b7280'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 12,
  },
  label: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  value: { fontSize: 15, color: '#f9fafb' },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  preferenceLabel: { fontSize: 15, color: '#f9fafb' },
});
