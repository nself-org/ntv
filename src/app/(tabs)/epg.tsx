/**
 * Purpose: EPG (Electronic Programme Guide) screen — horizontal timeline guide.
 * Inputs:  XMLTV/EPG data (stub for T03)
 * Outputs: Scrollable programme grid
 * Constraints: Placeholder UI — data and grid wired in T03.
 *              All strings i18n-wrapped via useNselfTranslation.
 *              Accessibility labels on interactive elements.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T08
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNselfTranslation } from '@nself/i18n';

export default function EpgScreen(): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityLabel={t('guide')}>{t('guide')}</Text>
      </View>
      <Pressable
        style={styles.placeholder}
        accessible
        accessibilityLabel={t('epgGrid')}
        accessibilityRole="text"
      >
        <Text style={styles.placeholderText}>{t('epgGrid')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#6b7280', fontSize: 14 },
});
