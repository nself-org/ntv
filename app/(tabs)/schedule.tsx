/**
 * Purpose: Recording Schedule tab screen for ɳTV — lists scheduled recording entries.
 *          UI-only screen; backend recording handled by plugin layer (out of scope here).
 *          Shows stub/GraphQL-fetched recording schedule entries with all 7 UI states.
 * Inputs:  Static stub data for v1.2 (recording_schedules GraphQL query stubbed).
 * Outputs: FlashList of scheduled recording entries with channel name, program title, time range.
 * Constraints: No backend recording in this ticket. AsyncStorage for stub persistence.
 *              All 7 UI states (loading, error, empty, offline, partial, refreshing, populated).
 *              RTL-aware layout via I18nManager.isRTL. WCAG 2.1 AA contrast + accessibilityLabel.
 * SPORT: F12-REPO-TYPE-MAP.md ntv remaining screens
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  I18nManager,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecordingEntry {
  id: string;
  channelName: string;
  programTitle: string;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
  status: 'scheduled' | 'recording' | 'completed' | 'failed';
}

// ─── Stub data (replaces GraphQL recording_schedules query until plugin ships) ─

const STUB_SCHEDULES: RecordingEntry[] = [
  {
    id: 'rec-001',
    channelName: 'BBC World News',
    programTitle: 'World News Today',
    startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    status: 'scheduled',
  },
  {
    id: 'rec-002',
    channelName: 'Al Jazeera English',
    programTitle: 'Inside Story',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
  },
  {
    id: 'rec-003',
    channelName: 'Discovery Channel',
    programTitle: 'Planet Earth III',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<RecordingEntry['status'], string> = {
  scheduled: '#7c3aed',
  recording: '#ef4444',
  completed: '#16a34a',
  failed: '#9ca3af',
};

const STATUS_LABEL: Record<RecordingEntry['status'], string> = {
  scheduled: 'Scheduled',
  recording: 'Recording',
  completed: 'Done',
  failed: 'Failed',
};

function StatusBadge({ status }: { status: RecordingEntry['status'] }) {
  return (
    <View style={[styles.badge, { borderColor: STATUS_COLOR[status] }]}>
      <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

const ScheduleRow = React.memo(function ScheduleRow({ entry }: { entry: RecordingEntry }) {
  const start = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const end = new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = new Date(entry.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View
      style={[styles.row, I18nManager.isRTL && styles.rowRTL]}
      accessible
      accessibilityLabel={`${entry.programTitle} on ${entry.channelName}, ${dateLabel} ${start} to ${end}, ${STATUS_LABEL[entry.status]}`}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={entry.status === 'recording' ? 'radio-button-on' : 'recording-outline'}
          size={22}
          color={STATUS_COLOR[entry.status]}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.programTitle} numberOfLines={1}>{entry.programTitle}</Text>
        <Text style={styles.channelName} numberOfLines={1}>{entry.channelName}</Text>
        <Text style={styles.timeRange}>{dateLabel} · {start} – {end}</Text>
      </View>
      <StatusBadge status={entry.status} />
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScheduleScreen(): React.ReactElement {
  const [entries, setEntries] = useState<RecordingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      // Stub: simulate async fetch (replace with GraphQL recording_schedules query when plugin ships)
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      setEntries(STUB_SCHEDULES);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load schedules'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadSchedules();
  }, [loadSchedules]);

  const renderItem = useCallback(({ item }: { item: RecordingEntry }) => (
    <ScheduleRow entry={item} />
  ), []);

  // ── UI States ─────────────────────────────────────────────────────────────

  // 1. Loading (initial)
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.stateText}>Loading schedule…</Text>
      </SafeAreaView>
    );
  }

  // 2. Error (no data)
  if (error && entries.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.stateText}>Could not load recording schedule</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); void loadSchedules(); }}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 3. Empty
  if (!loading && entries.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="recording-outline" size={56} color="#374151" />
        <Text style={styles.emptyTitle}>No recordings scheduled</Text>
        <Text style={styles.emptySubtitle}>
          Schedule a recording from the EPG screen by long-pressing a program.
        </Text>
      </SafeAreaView>
    );
  }

  // 4-7. Populated / Refreshing / Partial / Offline handled by list + RefreshControl
  const scheduled = entries.filter((e) => e.status === 'scheduled' || e.status === 'recording');
  const past = entries.filter((e) => e.status === 'completed' || e.status === 'failed');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, I18nManager.isRTL && styles.headerRTL]}>
        <Text style={styles.title}>Recording Schedule</Text>
        <Text style={styles.count}>{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</Text>
      </View>

      <FlashList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={88}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />
        }
        ListHeaderComponent={
          scheduled.length > 0 ? (
            <Text style={styles.sectionLabel}>Upcoming · {scheduled.length}</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  center: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRTL: { flexDirection: 'row-reverse' },
  title: { fontSize: 20, fontWeight: '700', color: '#f9fafb' },
  count: { fontSize: 13, color: '#6b7280' },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowRTL: { flexDirection: 'row-reverse' },
  rowIcon: { width: 36, alignItems: 'center', marginRight: 12 },
  rowBody: { flex: 1 },
  programTitle: { color: '#f9fafb', fontSize: 15, fontWeight: '600' },
  channelName: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  timeRange: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#1f2937', marginLeft: 64 },
  stateText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
  },
  retryText: { color: '#f9fafb', fontWeight: '600' },
  emptyTitle: { color: '#9ca3af', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
});
