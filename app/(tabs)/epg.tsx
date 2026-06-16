/**
 * Purpose: EPG (Electronic Program Guide) tab screen for nTV.
 * Displays a scrollable grid of channels × time slots (via EPGGrid component).
 * Provides day tabs (Today / Tomorrow / Day+2) to switch the time window.
 * Tapping a program opens a detail modal with title, description, times, and a record stub.
 *
 * Inputs: none (channel IDs come from useChannelList hook, stub for initial scaffold)
 *
 * Outputs: EPG grid screen, program detail modal
 *
 * Constraints:
 *   - All data via useEPG (GraphQL — see T03 for channel list hook integration).
 *   - Channel IDs are fetched separately; EPG depends on them being available.
 *   - FlashList is required in EPGGrid — this screen does not use FlatList.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG feature status updated
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EPGGrid } from '../../components/EPGGrid';
import { useEPG, EPGChannel, EPGProgram } from '../../hooks/useEPG';

// ---------------------------------------------------------------------------
// Day window helpers
// ---------------------------------------------------------------------------

type DayOffset = 0 | 1 | 2;

const DAY_LABELS: Record<DayOffset, string> = {
  0: 'Today',
  1: 'Tomorrow',
  2: 'Day +2',
};

function getWindowForDay(dayOffset: DayOffset): { start: Date; end: Date } {
  const start = new Date();
  // Set to midnight of the target day
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + dayOffset);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

// ---------------------------------------------------------------------------
// Day tabs
// ---------------------------------------------------------------------------

type DayTabsProps = {
  selected: DayOffset;
  onSelect: (day: DayOffset) => void;
};

const DayTabs = memo(function DayTabs({ selected, onSelect }: DayTabsProps) {
  return (
    <View style={styles.tabRow}>
      {([0, 1, 2] as DayOffset[]).map((day) => (
        <TouchableOpacity
          key={day}
          style={[styles.tab, selected === day && styles.tabSelected]}
          onPress={() => onSelect(day)}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === day }}
        >
          <Text
            style={[
              styles.tabLabel,
              selected === day && styles.tabLabelSelected,
            ]}
          >
            {DAY_LABELS[day]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Program detail modal
// ---------------------------------------------------------------------------

type ProgramDetailModalProps = {
  program: EPGProgram | null;
  channel: EPGChannel | null;
  onClose: () => void;
};

const ProgramDetailModal = memo(function ProgramDetailModal({
  program,
  channel,
  onClose,
}: ProgramDetailModalProps) {
  if (!program || !channel) return null;

  const durationLabel =
    program.durationMinutes >= 60
      ? `${Math.floor(program.durationMinutes / 60)}h ${program.durationMinutes % 60}m`
      : `${program.durationMinutes}m`;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalChannel}>{channel.name}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseLabel}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalTitle}>{program.title}</Text>

            <Text style={styles.modalMeta}>
              {formatDateTime(program.startTime)} → {formatDateTime(program.endTime)}
              {'  ·  '}
              {durationLabel}
            </Text>

            {program.description ? (
              <Text style={styles.modalDescription}>{program.description}</Text>
            ) : (
              <Text style={styles.modalDescriptionEmpty}>
                No description available.
              </Text>
            )}
          </ScrollView>

          {/* Record stub button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => {
                // Recording requires backend plugin — stub only in this release
              }}
              accessibilityLabel="Record program (requires backend plugin)"
              accessibilityRole="button"
            >
              <Text style={styles.recordButtonLabel}>⏺  Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// Stub channel IDs — replaced by useChannelList integration in T06+
// ---------------------------------------------------------------------------

/** Placeholder: replace with real channel ID list from useChannelList (T03). */
const STUB_CHANNEL_IDS: string[] = [];

// ---------------------------------------------------------------------------
// EPG screen
// ---------------------------------------------------------------------------

export default function EPGScreen() {
  const [selectedDay, setSelectedDay] = useState<DayOffset>(0);
  const [selectedProgram, setSelectedProgram] = useState<EPGProgram | null>(
    null,
  );
  const [selectedChannel, setSelectedChannel] = useState<EPGChannel | null>(
    null,
  );

  const { start, end } = useMemo(
    () => getWindowForDay(selectedDay),
    [selectedDay],
  );

  const { channels, programs, loading, error, refetch } = useEPG(
    STUB_CHANNEL_IDS,
    start,
    end,
  );

  const handleProgramPress = useCallback(
    (program: EPGProgram, channel: EPGChannel) => {
      setSelectedProgram(program);
      setSelectedChannel(channel);
    },
    [],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedProgram(null);
    setSelectedChannel(null);
  }, []);

  const handleDaySelect = useCallback((day: DayOffset) => {
    setSelectedDay(day);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Day tabs */}
      <DayTabs selected={selectedDay} onSelect={handleDaySelect} />

      {/* Grid area */}
      <View style={styles.gridContainer}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#63b3ed" />
            <Text style={styles.loadingLabel}>Loading guide…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centered}>
            <Text style={styles.errorLabel}>Failed to load guide.</Text>
            <TouchableOpacity
              onPress={refetch}
              style={styles.retryButton}
              accessibilityRole="button"
            >
              <Text style={styles.retryLabel}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && channels.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyLabel}>
              No channels found. Add an IPTV source in Settings to load the guide.
            </Text>
          </View>
        )}

        {!loading && !error && channels.length > 0 && (
          <EPGGrid
            channels={channels}
            programs={programs}
            startTime={start}
            endTime={end}
            onProgramPress={handleProgramPress}
          />
        )}
      </View>

      {/* Program detail modal */}
      {selectedProgram && selectedChannel && (
        <ProgramDetailModal
          program={selectedProgram}
          channel={selectedChannel}
          onClose={handleCloseModal}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  tabSelected: {
    backgroundColor: '#2b6cb0',
  },
  tabLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  tabLabelSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  gridContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingLabel: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 14,
  },
  errorLabel: {
    color: '#fc8181',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2b6cb0',
    borderRadius: 8,
  },
  retryLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyLabel: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalChannel: {
    color: '#90cdf4',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseLabel: {
    color: '#aaa',
    fontSize: 18,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMeta: {
    color: '#718096',
    fontSize: 12,
    marginBottom: 16,
  },
  modalDescription: {
    color: '#a0aec0',
    fontSize: 14,
    lineHeight: 22,
  },
  modalDescriptionEmpty: {
    color: '#4a5568',
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalActions: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  recordButton: {
    backgroundColor: '#2d3748',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  recordButtonLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
});
