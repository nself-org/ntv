/**
 * Purpose: IPTV source management section — M3U playlist CRUD + Xtream Codes CRUD.
 * Inputs:
 *   - m3uUrls: string[] — currently configured M3U playlist URLs
 *   - xtreamSources: XtreamCredentials[] — currently configured XTREAM accounts
 *   - onAddM3U: (url: string) => Promise<void>
 *   - onRemoveM3U: (url: string) => void
 *   - onAddXtream: (creds: XtreamCredentials) => Promise<void>
 *   - onRemoveXtream: (server: string) => void
 *   - t: translation function from useNselfTranslation
 * Outputs: Section header + M3U list + M3U add row + XTREAM list + XTREAM add form.
 * Constraints: RTL support via I18nManager. WCAG 2.1 AA contrast + 44pt touch targets.
 * SPORT: P4-E0-W2-S07-T01 settings refactor
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { XtreamCredentials } from '../../services/xtream';
import { SettingsSectionHeader } from './SettingsSectionHeader';

interface IptvSourceSectionProps {
  m3uUrls: string[];
  xtreamSources: XtreamCredentials[];
  onAddM3U: (url: string) => Promise<void>;
  onRemoveM3U: (url: string) => void;
  onAddXtream: (creds: XtreamCredentials) => Promise<void>;
  onRemoveXtream: (server: string) => void;
  t: (key: string) => string;
}

/**
 * Settings section for managing IPTV sources (M3U + Xtream Codes).
 * Contains all form state internally so the parent settings screen stays lean.
 */
export function IptvSourceSection({
  m3uUrls,
  xtreamSources,
  onAddM3U,
  onRemoveM3U,
  onAddXtream,
  onRemoveXtream,
  t,
}: IptvSourceSectionProps): React.ReactElement {
  const [m3uInput, setM3uInput] = useState('');
  const [m3uSaving, setM3uSaving] = useState(false);
  const [xtServer, setXtServer] = useState('');
  const [xtUser, setXtUser] = useState('');
  const [xtPass, setXtPass] = useState('');
  const [xtSaving, setXtSaving] = useState(false);

  const handleAddM3U = useCallback(async () => {
    const url = m3uInput.trim();
    if (!url) return;
    setM3uSaving(true);
    try {
      await onAddM3U(url);
      setM3uInput('');
    } finally {
      setM3uSaving(false);
    }
  }, [m3uInput, onAddM3U]);

  const handleRemoveM3U = useCallback((url: string) => {
    Alert.alert(`${t('remove')} source`, `Remove "${url}"?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => onRemoveM3U(url) },
    ]);
  }, [onRemoveM3U, t]);

  const handleAddXtream = useCallback(async () => {
    const server = xtServer.trim();
    const username = xtUser.trim();
    const password = xtPass.trim();
    if (!server || !username || !password) {
      Alert.alert('Missing fields', t('xtream.validation'));
      return;
    }
    setXtSaving(true);
    try {
      await onAddXtream({ server, username, password });
      setXtServer('');
      setXtUser('');
      setXtPass('');
    } finally {
      setXtSaving(false);
    }
  }, [xtServer, xtUser, xtPass, onAddXtream, t]);

  const handleRemoveXtream = useCallback((creds: XtreamCredentials) => {
    Alert.alert(`${t('remove')} source`, `Remove "${creds.server}"?`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('remove'), style: 'destructive', onPress: () => onRemoveXtream(creds.server) },
    ]);
  }, [onRemoveXtream, t]);

  return (
    <>
      <SettingsSectionHeader title={t('iptv.sources')} />

      {/* M3U subsection */}
      <Text style={[styles.subsectionLabel, I18nManager.isRTL && styles.textRTL]}>
        {t('m3u.playlists')}
      </Text>

      {m3uUrls.length === 0 ? (
        <Text style={[styles.emptyNote, I18nManager.isRTL && styles.textRTL]}>
          {t('m3u.none')}
        </Text>
      ) : (
        m3uUrls.map((url) => (
          <View key={url} style={[styles.sourceRow, I18nManager.isRTL && styles.sourceRowRTL]}>
            <Text style={styles.sourceUrl} numberOfLines={1}>{url}</Text>
            <Pressable
              style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
              onPress={() => handleRemoveM3U(url)}
              accessibilityRole="button"
              accessibilityLabel={`${t('m3u.removeLabel')} ${url}`}
              hitSlop={8}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={[styles.addRow, I18nManager.isRTL && styles.addRowRTL]}>
        <TextInput
          style={[styles.addInput, I18nManager.isRTL && styles.inputRTL]}
          placeholder={t('m3u.placeholder')}
          placeholderTextColor="#6b7280"
          value={m3uInput}
          onChangeText={setM3uInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={handleAddM3U}
          accessibilityLabel={t('m3u.playlists')}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.addBtnPressed,
            (m3uSaving || !m3uInput.trim()) && styles.btnDisabled,
          ]}
          onPress={handleAddM3U}
          disabled={m3uSaving || !m3uInput.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('m3u.add')}
        >
          {m3uSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>{t('m3u.add')}</Text>
          )}
        </Pressable>
      </View>

      {/* XTREAM subsection */}
      <Text style={[styles.subsectionLabel, I18nManager.isRTL && styles.textRTL]}>
        {t('xtream.sources')}
      </Text>

      {xtreamSources.length === 0 ? (
        <Text style={[styles.emptyNote, I18nManager.isRTL && styles.textRTL]}>
          {t('xtream.none')}
        </Text>
      ) : (
        xtreamSources.map((creds) => (
          <View key={creds.server} style={[styles.sourceRow, I18nManager.isRTL && styles.sourceRowRTL]}>
            <View style={styles.xtreamMeta}>
              <Text style={styles.sourceUrl} numberOfLines={1}>{creds.server}</Text>
              <Text style={styles.xtreamUser}>{creds.username}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
              onPress={() => handleRemoveXtream(creds)}
              accessibilityRole="button"
              accessibilityLabel={`${t('m3u.removeLabel')} ${creds.server}`}
              hitSlop={8}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        ))
      )}

      {/* Add XTREAM form */}
      <View style={styles.card}>
        <TextInput
          style={[styles.fieldInput, I18nManager.isRTL && styles.inputRTL]}
          placeholder={t('xtream.serverPlaceholder')}
          placeholderTextColor="#6b7280"
          value={xtServer}
          onChangeText={setXtServer}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel={t('xtream.server')}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />
        <View style={styles.fieldSep} />
        <TextInput
          style={[styles.fieldInput, I18nManager.isRTL && styles.inputRTL]}
          placeholder={t('xtream.usernamePlaceholder')}
          placeholderTextColor="#6b7280"
          value={xtUser}
          onChangeText={setXtUser}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('xtream.username')}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />
        <View style={styles.fieldSep} />
        <TextInput
          style={[styles.fieldInput, I18nManager.isRTL && styles.inputRTL]}
          placeholder={t('xtream.passwordPlaceholder')}
          placeholderTextColor="#6b7280"
          value={xtPass}
          onChangeText={setXtPass}
          autoCapitalize="none"
          secureTextEntry
          accessibilityLabel={t('xtream.password')}
          textAlign={I18nManager.isRTL ? 'right' : 'left'}
        />
        <Pressable
          style={({ pressed }) => [
            styles.fullBtn,
            pressed && styles.fullBtnPressed,
            (xtSaving || !xtServer.trim()) && styles.btnDisabled,
          ]}
          onPress={handleAddXtream}
          disabled={xtSaving || !xtServer.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('xtream.add')}
        >
          {xtSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.fullBtnText}>{t('xtream.add')}</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  subsectionLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 6, marginTop: 12 },
  emptyNote: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  sourceRowRTL: { flexDirection: 'row-reverse' },
  sourceUrl: { flex: 1, fontSize: 13, color: '#d1d5db' },
  xtreamMeta: { flex: 1 },
  xtreamUser: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  removeBtn: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, backgroundColor: '#1f2937', marginStart: 8,
  },
  removeBtnPressed: { opacity: 0.6 },
  removeBtnText: { fontSize: 12, color: '#9ca3af' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addRowRTL: { flexDirection: 'row-reverse' },
  addInput: {
    flex: 1, height: 44, backgroundColor: '#111827', borderRadius: 8,
    paddingHorizontal: 12, fontSize: 14, color: '#f9fafb',
  },
  inputRTL: { textAlign: 'right' },
  addBtn: {
    height: 44, paddingHorizontal: 18, backgroundColor: '#0ea5e9',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  addBtnPressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  card: { backgroundColor: '#111827', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  fieldInput: { height: 44, paddingHorizontal: 12, fontSize: 14, color: '#f9fafb' },
  fieldSep: { height: StyleSheet.hairlineWidth, backgroundColor: '#1f2937', marginHorizontal: 12 },
  fullBtn: {
    margin: 12, height: 44, backgroundColor: '#0ea5e9',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  fullBtnPressed: { opacity: 0.8 },
  fullBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
