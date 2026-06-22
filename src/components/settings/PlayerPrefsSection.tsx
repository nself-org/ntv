/**
 * Purpose: Player preferences section for settings screen — buffer size + default quality.
 * Inputs:
 *   - bufferSecs: string — current buffer duration (seconds as string for TextInput)
 *   - quality: 'auto' | '720' | '1080'
 *   - onBufferChange: (v: string) => void
 *   - onQualityChange: (q: 'auto' | '720' | '1080') => void
 *   - t: translation function
 * Outputs: Section header + card with buffer input + segmented quality control.
 * Constraints: RTL support. WCAG 2.1 AA. Segmented control uses accessibilityRole="radio".
 * SPORT: P4-E0-W2-S07-T01 settings refactor
 */

import React from 'react';
import { I18nManager, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SettingsSectionHeader } from './SettingsSectionHeader';

type Quality = 'auto' | '720' | '1080';

interface PlayerPrefsSectionProps {
  bufferSecs: string;
  quality: Quality;
  onBufferChange: (v: string) => void;
  onQualityChange: (q: Quality) => void;
  t: (key: string) => string;
}

/** Player preferences card: buffer size + default quality segmented control. */
export function PlayerPrefsSection({
  bufferSecs,
  quality,
  onBufferChange,
  onQualityChange,
  t,
}: PlayerPrefsSectionProps): React.ReactElement {
  return (
    <>
      <SettingsSectionHeader title="Player" />
      <View style={styles.card}>
        <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
          <Text style={styles.prefLabel}>{t('player.bufferLabel')}</Text>
          <TextInput
            style={styles.bufferInput}
            value={bufferSecs}
            onChangeText={(v) => onBufferChange(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel={t('player.bufferLabel')}
            textAlign="center"
          />
        </View>
        <View style={styles.fieldSep} />
        <View style={[styles.prefRow, I18nManager.isRTL && styles.prefRowRTL]}>
          <Text style={styles.prefLabel}>{t('player.qualityLabel')}</Text>
          <View style={[styles.segmented, I18nManager.isRTL && styles.segmentedRTL]}>
            {(['auto', '720', '1080'] as const).map((q) => (
              <Pressable
                key={q}
                style={[styles.segment, quality === q && styles.segmentActive]}
                onPress={() => onQualityChange(q)}
                accessibilityRole="radio"
                accessibilityState={{ checked: quality === q }}
                accessibilityLabel={q === 'auto' ? t('auto') : `${q}p`}
              >
                <Text style={[styles.segmentText, quality === q && styles.segmentTextActive]}>
                  {q === 'auto' ? t('auto') : `${q}p`}
                </Text>
              </Pressable>
            ))}
          </View>
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
  bufferInput: {
    width: 56, height: 36, backgroundColor: '#1f2937', borderRadius: 6,
    fontSize: 15, color: '#f9fafb', textAlign: 'center',
  },
  segmented: { flexDirection: 'row', backgroundColor: '#1f2937', borderRadius: 6, overflow: 'hidden' },
  segmentedRTL: { flexDirection: 'row-reverse' },
  segment: { paddingHorizontal: 12, paddingVertical: 6 },
  segmentActive: { backgroundColor: '#0ea5e9' },
  segmentText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  segmentTextActive: { color: '#ffffff', fontWeight: '700' },
});
