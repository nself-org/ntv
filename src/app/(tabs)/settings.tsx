/**
 * Purpose: Settings screen — M3U/XTREAM source management, player preferences,
 *          locale selection, notification toggles, and about section.
 *
 * Inputs:
 *   - Source URLs and XTREAM credentials from useChannelList hook (AsyncStorage-backed).
 *   - Locale from useLocale context (set via _layout LocaleProvider).
 *   - Player preference toggles managed via local state (wire to AsyncStorage prefs hook when added).
 *
 * Outputs:
 *   - Scrollable settings form composed of focused subcomponents per section.
 *
 * Constraints:
 *   - All 7 UI states: loading | loaded | saving | error | success | offline | empty.
 *   - RTL: I18nManager flips row directions and text alignment.
 *   - WCAG 2.1 AA: labels for all inputs, contrast ≥ 4.5:1, min touch target 44 pt.
 *   - All strings via useNselfTranslation hook.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv settings-screen status updated
 */

import React, { useCallback, useState } from 'react';
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNselfTranslation } from '@nself/i18n';
import { useLocale } from '../_layout';
import { useChannelList } from '../../../hooks/useChannelList';
import { SettingsSectionHeader } from '../../components/settings/SettingsSectionHeader';
import { IptvSourceSection } from '../../components/settings/IptvSourceSection';
import { PlayerPrefsSection } from '../../components/settings/PlayerPrefsSection';
import { NotificationsSection } from '../../components/settings/NotificationsSection';
import type { XtreamCredentials } from '../../../services/xtream';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = '1.2.0';

const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SettingsScreen(): React.ReactElement {
  const { t } = useNselfTranslation();
  const { locale, setLocale } = useLocale();
  const {
    m3uUrls,
    addM3USource,
    removeM3USource,
    xtreamSources,
    addXtreamSource,
    removeXtreamSource,
  } = useChannelList();

  // Player prefs (local state — wire to AsyncStorage preference hook when added)
  const [bufferSecs, setBufferSecs] = useState('30');
  const [quality, setQuality] = useState<'auto' | '720' | '1080'>('auto');

  // Notification toggles
  const [notifsSchedule, setNotifsSchedule] = useState(false);
  const [notifsNew, setNotifsNew] = useState(false);

  const handleNextLocale = useCallback(() => {
    const idx = SUPPORTED_LOCALES.findIndex((l) => l.code === locale);
    const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length];
    setLocale(next.code as any);
  }, [locale, setLocale]);

  const currentLocaleName =
    SUPPORTED_LOCALES.find((l) => l.code === locale)?.name ?? locale;

  const handleAddXtream = useCallback(
    async (creds: XtreamCredentials) => {
      await addXtreamSource(creds);
    },
    [addXtreamSource],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, I18nManager.isRTL && styles.textRTL]}>
          {t('settings')}
        </Text>

        {/* ── Language ── */}
        <SettingsSectionHeader title="Language" />
        <Pressable
          style={[styles.card, styles.langRow, I18nManager.isRTL && styles.langRowRTL]}
          onPress={handleNextLocale}
          accessibilityRole="button"
          accessibilityLabel={`${t('language.label')}: ${currentLocaleName}. ${t('language.hint')}`}
        >
          <Text style={styles.prefLabel}>{t('language.label')}</Text>
          <Text style={styles.langValue}>{currentLocaleName}</Text>
        </Pressable>

        {/* ── IPTV Sources ── */}
        <IptvSourceSection
          m3uUrls={m3uUrls}
          xtreamSources={xtreamSources}
          onAddM3U={addM3USource}
          onRemoveM3U={removeM3USource}
          onAddXtream={handleAddXtream}
          onRemoveXtream={removeXtreamSource}
          t={t}
        />

        {/* ── Player Prefs ── */}
        <PlayerPrefsSection
          bufferSecs={bufferSecs}
          quality={quality}
          onBufferChange={setBufferSecs}
          onQualityChange={setQuality}
          t={t}
        />

        {/* ── Notifications ── */}
        <NotificationsSection
          notifsSchedule={notifsSchedule}
          notifsNew={notifsNew}
          onScheduleChange={setNotifsSchedule}
          onNewChange={setNotifsNew}
          t={t}
        />

        {/* ── About ── */}
        <SettingsSectionHeader title="About" />
        <View style={styles.card}>
          <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
            <Text style={styles.prefLabel}>{t('about.version')}</Text>
            <Text style={styles.aboutValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.fieldSep} />
          <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
            <Text style={styles.prefLabel}>{t('about.license')}</Text>
            <Text style={styles.aboutValue}>{t('about.openSource')}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f9fafb', paddingTop: 8, paddingBottom: 16 },
  textRTL: { textAlign: 'right' },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14, minHeight: 52,
  },
  langRowRTL: { flexDirection: 'row-reverse' },
  langValue: { fontSize: 15, fontWeight: '600', color: '#38bdf8' },
  card: { backgroundColor: '#111827', borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  prefRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 44,
  },
  prefRowRTL: { flexDirection: 'row-reverse' },
  prefLabel: { fontSize: 15, color: '#f9fafb', flex: 1 },
  fieldSep: { height: StyleSheet.hairlineWidth, backgroundColor: '#1f2937', marginHorizontal: 12 },
  aboutValue: { fontSize: 13, color: '#9ca3af', textAlign: 'right', flex: 1, marginStart: 16 },
  bottomSpacer: { height: 24 },
});
