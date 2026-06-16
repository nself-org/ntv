/**
 * Purpose: Channel list screen — lists IPTV channels grouped by category.
 * Inputs:  GraphQL channel data (stub for T03)
 * Outputs: Scrollable channel list with tap-to-play
 * Constraints: Placeholder UI — playback wired in T02, data in T03.
 *              All strings i18n-wrapped via useNselfTranslation.
 *              Accessibility labels on interactive elements.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T08
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNselfTranslation } from '@nself/i18n';

export default function ChannelsScreen(): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityLabel={t('ntvTitle')}>{t('ntvTitle')}</Text>
        <Text style={styles.subtitle} accessibilityLabel={t('channels')}>{t('channels')}</Text>
      </View>
      <Pressable
        style={styles.placeholder}
        accessible
        accessibilityLabel={t('channelList')}
        accessibilityRole="text"
      >
        <Text style={styles.placeholderText}>{t('channelList')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#0ea5e9' },
  subtitle: { fontSize: 16, color: '#9ca3af', marginTop: 2 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6b7280', fontSize: 14 },
});
