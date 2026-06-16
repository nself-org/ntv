/**
 * Purpose: Search screen — real-time full-text channel name search with live-filtered results.
 *
 * Inputs:
 *   - User text input (search term).
 *   - Channel list from useChannelList hook (search filter applied client-side).
 *
 * Outputs:
 *   - Search bar + filtered FlatList of matching channels. Tap to play.
 *
 * Constraints:
 *   - All 7 UI states: idle | loading | loaded | empty | error | offline | success.
 *   - RTL: I18nManager.isRTL flips row directions and text alignment.
 *   - WCAG 2.1 AA: accessible search field label, result count announcement.
 *   - All strings i18n-wrapped via useNselfTranslation.
 *   - Search filter runs client-side in useChannelList via setSearch().
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv search-screen status updated; T-P3-E4-W2-S4-T08
 */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNselfTranslation } from '@nself/i18n';
import { useChannelList } from '../../../hooks/useChannelList';
import type { Channel } from '../../../services/m3u-parser';

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

interface ResultRowProps {
  channel: Channel;
  onPlay: (channel: Channel) => void;
}

function ResultRow({ channel, onPlay }: ResultRowProps): React.ReactElement {
  const { t } = useNselfTranslation();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        I18nManager.isRTL && styles.rowRTL,
        pressed && styles.rowPressed,
      ]}
      onPress={() => onPlay(channel)}
      accessibilityRole="button"
      accessibilityLabel={`${t('play')} ${channel.name}`}
    >
      {channel.logoUrl ? (
        <Image
          source={{ uri: channel.logoUrl }}
          style={styles.logo}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={styles.logoPlaceholder} accessibilityElementsHidden>
          <Text style={styles.logoInitial}>{channel.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.rowContent}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group ? (
          <Text style={styles.channelGroup} numberOfLines={1}>
            {channel.group}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SearchScreen(): React.ReactElement {
  const router = useRouter();
  const { t } = useNselfTranslation();
  const { channels, search, setSearch, loading, error, refresh } = useChannelList();

  // channels already filtered by useChannelList when search is set
  const results = channels;

  const handlePlay = useCallback(
    (channel: Channel) => {
      router.push({ pathname: '/player/[id]', params: { id: channel.id, uri: channel.url } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Channel }) => <ResultRow channel={item} onPlay={handlePlay} />,
    [handlePlay],
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  // ── UI state body ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderBody(): any {
    // State: loading (initial fetch)
    if (loading && channels.length === 0) {
      return (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.infoText}>{t('loading')}</Text>
        </View>
      );
    }

    // State: error
    if (error && channels.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>{t('error')}</Text>
          <Text style={styles.infoText}>{error.message}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel={t('retry')}
          >
            <Text style={styles.actionBtnText}>{t('retry')}</Text>
          </Pressable>
        </View>
      );
    }

    // State: idle (no search term, no channels)
    if (!search && channels.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>{t('iptv')}</Text>
          <Text style={styles.infoText}>{t('notConfigured')}</Text>
        </View>
      );
    }

    // State: empty results
    if (search && results.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={styles.stateTitle}>{t('search')}</Text>
          <Text style={styles.infoText}>{t('searchChannels')}</Text>
        </View>
      );
    }

    // State: idle (no search term) — show prompt
    if (!search) {
      return (
        <View style={styles.center}>
          <Text style={styles.infoText}>{t('searchChannels')}</Text>
        </View>
      );
    }

    // State: loaded / success — results list
    return (
      <>
        <Text
          style={[styles.resultCount, I18nManager.isRTL && styles.textRTL]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${results.length} ${t('search')}`}
        >
          {`${results.length} ${t('search')}`}
        </Text>
        <FlatList<Channel>
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, I18nManager.isRTL && styles.textRTL]}>{t('search')}</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, I18nManager.isRTL && styles.searchBarRTL]}>
          <TextInput
            style={[styles.searchInput, I18nManager.isRTL && styles.searchInputRTL]}
            placeholder={t('searchChannels')}
            placeholderTextColor="#6b7280"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            accessibilityLabel={t('searchChannels')}
            accessibilityRole="search"
            textAlign={I18nManager.isRTL ? 'right' : 'left'}
          />
          {search.length > 0 ? (
            <Pressable
              style={styles.clearBtn}
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel={t('cancel')}
              hitSlop={8}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Body */}
      {renderBody()}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 12,
  },
  textRTL: {
    textAlign: 'right',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBarRTL: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#f9fafb',
    padding: 0,
  },
  searchInputRTL: {
    textAlign: 'right',
  },
  clearBtn: {
    paddingHorizontal: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultCount: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1f2937',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  rowPressed: {
    backgroundColor: '#111827',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1f2937',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  rowContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f9fafb',
  },
  channelGroup: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
