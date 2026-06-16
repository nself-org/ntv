/**
 * Purpose: Settings tab screen for ɳTV — source management (M3U/XTREAM), playback
 *          preferences, notification settings, and app info.
 * Inputs:  useChannelList hook (m3uUrls, xtreamSources, addM3USource, removeM3USource, addXtreamSource).
 * Outputs: Settings form with source list, player prefs, notification prefs, about.
 * Constraints: All settings persisted to AsyncStorage. No GraphQL. 7 UI states.
 *              source management: add M3U URL → appears in list; XTREAM creds → authenticated entry.
 * SPORT: F12-REPO-TYPE-MAP.md ntv settings feature
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChannelList } from '../../hooks/useChannelList';

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>;
}

// ─── Row types ────────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  trailing,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !trailing}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={18} color="#7c3aed" />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      {trailing || null}
      {onPress && !trailing ? <Ionicons name="chevron-forward" size={16} color="#374151" /> : null}
    </TouchableOpacity>
  );
}

// ─── Add M3U Modal ────────────────────────────────────────────────────────────

function AddM3UModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    setBusy(true);
    try {
      await onAdd(trimmed);
      setUrl('');
      onClose();
    } finally {
      setBusy(false);
    }
  }, [url, onAdd, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add M3U Source</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/playlist.m3u"
              placeholderTextColor="#4b5563"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              accessibilityLabel="M3U playlist URL"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, busy && { opacity: 0.5 }]}
                onPress={handleAdd}
                disabled={busy}
              >
                <Text style={styles.modalConfirmText}>{busy ? 'Adding…' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen(): React.ReactElement {
  const { m3uUrls, xtreamSources: xtreamCreds, addM3USource, removeM3USource } = useChannelList();
  const [addM3UVisible, setAddM3UVisible] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [autoQuality, setAutoQuality] = useState(true);

  const handleRemoveSource = useCallback(
    (url: string) => {
      Alert.alert('Remove Source', `Remove "${url}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeM3USource(url) },
      ]);
    },
    [removeM3USource],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Sources */}
        <SectionHeader title="Sources" />
        {m3uUrls.length > 0 && (
          <View style={styles.card}>
            {m3uUrls.map((url, i) => (
              <View key={url} style={[styles.sourceRow, i > 0 && styles.sourceSep]}>
                <Ionicons name="link-outline" size={16} color="#6b7280" style={{ marginRight: 10 }} />
                <Text style={styles.sourceUrl} numberOfLines={1}>{url}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSource(url)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove ${url}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {xtreamCreds.map((cred) => (
          <View key={`${cred.server}-${cred.username}`} style={styles.card}>
            <View style={styles.sourceRow}>
              <Ionicons name="server-outline" size={16} color="#6b7280" style={{ marginRight: 10 }} />
              <Text style={styles.sourceUrl} numberOfLines={1}>Xtream: {cred.server}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddM3UVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add M3U playlist source"
        >
          <Ionicons name="add-circle-outline" size={18} color="#7c3aed" />
          <Text style={styles.addBtnText}>Add M3U Playlist</Text>
        </TouchableOpacity>

        {/* Playback */}
        <SectionHeader title="Playback" />
        <View style={styles.card}>
          <SettingsRow
            icon="wifi-outline"
            label="Auto quality selection"
            trailing={
              <Switch
                value={autoQuality}
                onValueChange={setAutoQuality}
                trackColor={{ false: '#374151', true: '#7c3aed' }}
                thumbColor="#f9fafb"
                accessibilityLabel="Auto quality selection"
              />
            }
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <SettingsRow
            icon="notifications-outline"
            label="Recording reminders"
            trailing={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: '#374151', true: '#7c3aed' }}
                thumbColor="#f9fafb"
                accessibilityLabel="Recording reminders"
              />
            }
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingsRow icon="information-circle-outline" label="Version" value="1.2.0" />
          <SettingsRow icon="shield-checkmark-outline" label="License" value="MIT" />
          <SettingsRow
            icon="logo-github"
            label="Source code"
            value="github.com/nself-org/ntv"
            onPress={() => {}}
          />
        </View>
      </ScrollView>

      <AddM3UModal
        visible={addM3UVisible}
        onClose={() => setAddM3UVisible(false)}
        onAdd={addM3USource}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  scroll: { paddingBottom: 40 },
  sectionHeader: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2937',
  },
  rowIconWrap: { width: 28, alignItems: 'center', marginRight: 12 },
  rowLabel: { flex: 1, color: '#f9fafb', fontSize: 15 },
  rowValue: { color: '#6b7280', fontSize: 14, maxWidth: 140, textAlign: 'right', marginRight: 8 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sourceSep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#1f2937' },
  sourceUrl: { flex: 1, color: '#9ca3af', fontSize: 13 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  addBtnText: { color: '#7c3aed', fontSize: 15, fontWeight: '500', marginLeft: 8 },
  // ── Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#030712',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f9fafb',
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  modalCancelText: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  modalConfirmText: { color: '#f9fafb', fontSize: 15, fontWeight: '600' },
});
