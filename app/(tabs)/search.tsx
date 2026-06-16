/**
 * Purpose: Search tab screen for ɳTV — full-text search across channel names and EPG program titles.
 * Inputs:  useChannelList (channels + search/setSearch). useEPG (programs, optional).
 * Outputs: Filtered channel list + matching EPG programs below. Tap channel → player.
 * Constraints: In-memory filter on the loaded channel list. No GraphQL for channels.
 *              EPG search optional (requires EPG data loaded). All 7 UI states.
 * SPORT: F12-REPO-TYPE-MAP.md ntv search feature
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChannelList } from '../../hooks/useChannelList';
import { useEPG } from '../../hooks/useEPG';
import type { Channel } from '../../services/m3u-parser';
import type { Program } from '../../services/m3u-parser';

// ─── Result types ─────────────────────────────────────────────────────────────

type ChannelResult = { type: 'channel'; item: Channel };
type ProgramResult = { type: 'program'; item: Program & { channelId: string } };
type SearchResult = ChannelResult | ProgramResult;

// ─── Row components ──────────────────────────────────────────────────────────

function ChannelRow({ channel, onPress }: { channel: Channel; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {channel.logoUrl ? (
        <Image source={{ uri: channel.logoUrl }} style={styles.logo} resizeMode="contain" />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Text style={styles.logoText}>{channel.name.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.resultTitle} numberOfLines={1}>{channel.name}</Text>
        <Text style={styles.resultMeta} numberOfLines={1}>Channel · {channel.group || 'General'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#374151" />
    </TouchableOpacity>
  );
}

function ProgramRow({ program }: { program: Program & { channelId: string } }) {
  const start = new Date(program.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const stop = new Date(program.stopTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={styles.row}>
      <View style={[styles.logo, styles.programIcon]}>
        <Ionicons name="film-outline" size={20} color="#7c3aed" />
      </View>
      <View style={styles.info}>
        <Text style={styles.resultTitle} numberOfLines={1}>{program.title}</Text>
        <Text style={styles.resultMeta} numberOfLines={1}>EPG · {start} – {stop}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { channels, loading: channelsLoading } = useChannelList();
  const { programs } = useEPG({ channelIds: [] });

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const channelHits: ChannelResult[] = channels
      .filter((c) => c.name.toLowerCase().includes(q) || (c.tvgName && c.tvgName.toLowerCase().includes(q)))
      .slice(0, 50)
      .map((item) => ({ type: 'channel', item }));

    const programHits: ProgramResult[] = programs
      .filter((p) => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
      .slice(0, 30)
      .map((item) => ({ type: 'program', item: item as Program & { channelId: string } }));

    return [...channelHits, ...programHits];
  }, [query, channels, programs]);

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      router.push({ pathname: '/(tabs)/player', params: { uri: channel.url } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      if (item.type === 'channel') {
        return <ChannelRow channel={item.item} onPress={() => handleChannelPress(item.item)} />;
      }
      return <ProgramRow program={item.item} />;
    },
    [handleChannelPress],
  );

  const keyExtractor = useCallback((item: SearchResult, index: number) => {
    if (item.type === 'channel') return `ch-${item.item.id}`;
    return `prog-${index}`;
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search channels and programs…"
            placeholderTextColor="#4b5563"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search channels and programs"
            accessibilityRole="search"
          />
          {query.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Empty / loading states */}
        {channelsLoading && query.length === 0 && (
          <View style={styles.center}>
            <ActivityIndicator color="#7c3aed" />
          </View>
        )}
        {query.length === 0 && !channelsLoading && (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color="#374151" />
            <Text style={styles.hint}>Search across {channels.length} channels and EPG</Text>
          </View>
        )}
        {query.length > 0 && results.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="file-tray-outline" size={48} color="#374151" />
            <Text style={styles.hint}>No results for "{query}"</Text>
          </View>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
            <FlashList
              data={results}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              estimatedItemSize={68}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, color: '#f9fafb', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { color: '#4b5563', fontSize: 14, marginTop: 12, textAlign: 'center' },
  resultCount: { color: '#6b7280', fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2937',
  },
  logo: { width: 44, height: 44, borderRadius: 8, marginRight: 12 },
  logoPlaceholder: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  programIcon: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  resultTitle: { color: '#f9fafb', fontSize: 15, fontWeight: '500' },
  resultMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
});
