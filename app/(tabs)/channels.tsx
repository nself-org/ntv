/**
 * Purpose: IPTV Channel List screen for ɳTV — displays M3U/Xtream channels in a virtualized
 *          SectionList grouped by category, with search filter, favorites toggle, and source management.
 * Inputs:  useChannelList hook (M3U/Xtream sources from AsyncStorage).
 * Outputs: Rendered channel list. Tap → navigates to player screen with channel URL.
 * Constraints: React Native + Expo Router. No Flutter. Offline-first via AsyncStorage cache.
 * SPORT: F12-REPO-TYPE-MAP.md ntv iptv-data feature
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  type SectionListRenderItemInfo,
  type ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChannelList } from '../../hooks/useChannelList';
import type { Channel } from '../../services/m3u-parser';
import type { ChannelSection } from '../../hooks/useChannelList';

// ─── Channel Row ─────────────────────────────────────────────────────────────

interface ChannelRowProps {
  channel: Channel;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
}

const ChannelRow = React.memo(function ChannelRow({
  channel,
  isFavorite,
  onPress,
  onFavoritePress,
}: ChannelRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {channel.logoUrl ? (
        <Image
          source={{ uri: channel.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
          defaultSource={require('../../assets/channel-placeholder.png')}
        />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Text style={styles.logoPlaceholderText} numberOfLines={1}>
            {channel.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.rowContent}>
        <Text style={styles.channelName} numberOfLines={1}>
          {channel.name}
        </Text>
        {channel.group.trim() !== '' && (
          <Text style={styles.channelGroup} numberOfLines={1}>
            {channel.group}
          </Text>
        )}
      </View>

      {/* Live indicator dot */}
      <View style={styles.liveIndicator} />

      {/* Favorite heart button */}
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={onFavoritePress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        accessibilityRole="button"
      >
        <Text style={[styles.heart, isFavorite && styles.heartActive]}>
          {isFavorite ? '♥' : '♡'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ─── Add Source Modal ─────────────────────────────────────────────────────────

interface AddSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onAddM3U: (url: string) => void;
  onAddXtream: (server: string, username: string, password: string) => void;
}

function AddSourceModal({ visible, onClose, onAddM3U, onAddXtream }: AddSourceModalProps) {
  const [tab, setTab] = useState<'m3u' | 'xtream'>('m3u');
  const [m3uUrl, setM3uUrl] = useState('');
  const [xtreamServer, setXtreamServer] = useState('');
  const [xtreamUser, setXtreamUser] = useState('');
  const [xtreamPass, setXtreamPass] = useState('');

  const handleAdd = () => {
    if (tab === 'm3u') {
      const trimmed = m3uUrl.trim();
      if (!trimmed.startsWith('http')) {
        Alert.alert('Invalid URL', 'Please enter a valid M3U HTTP URL');
        return;
      }
      onAddM3U(trimmed);
      setM3uUrl('');
      onClose();
    } else {
      const server = xtreamServer.trim();
      const user = xtreamUser.trim();
      const pass = xtreamPass.trim();
      if (!server || !user || !pass) {
        Alert.alert('Missing fields', 'Please fill in all Xtream fields');
        return;
      }
      onAddXtream(server, user, pass);
      setXtreamServer('');
      setXtreamUser('');
      setXtreamPass('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add IPTV Source</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switch */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'm3u' && styles.tabBtnActive]}
            onPress={() => setTab('m3u')}
          >
            <Text style={[styles.tabBtnText, tab === 'm3u' && styles.tabBtnTextActive]}>M3U URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'xtream' && styles.tabBtnActive]}
            onPress={() => setTab('xtream')}
          >
            <Text style={[styles.tabBtnText, tab === 'xtream' && styles.tabBtnTextActive]}>Xtream</Text>
          </TouchableOpacity>
        </View>

        {tab === 'm3u' ? (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Playlist URL</Text>
            <TextInput
              style={styles.input}
              placeholder="http://example.com/playlist.m3u"
              placeholderTextColor="#888"
              value={m3uUrl}
              onChangeText={setM3uUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
          </View>
        ) : (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Server URL</Text>
              <TextInput
                style={styles.input}
                placeholder="http://example.com:8080"
                placeholderTextColor="#888"
                value={xtreamServer}
                onChangeText={setXtreamServer}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor="#888"
                value={xtreamUser}
                onChangeText={setXtreamUser}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="#888"
                value={xtreamPass}
                onChangeText={setXtreamPass}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add Source</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChannelsScreen() {
  const router = useRouter();
  const {
    sections,
    favorites,
    search,
    setSearch,
    toggleFavorite,
    loading,
    error,
    refresh,
    addM3USource,
    addXtreamSource,
    m3uUrls,
    xtreamSources,
  } = useChannelList();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      router.push({
        pathname: '/player',
        params: {
          streamUrl: channel.url,
          channelId: channel.id,
          channelName: channel.name,
          channelLogo: channel.logoUrl,
        },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<Channel, ChannelSection>) => (
      <ChannelRow
        channel={item}
        isFavorite={favorites.has(item.id)}
        onPress={() => handleChannelPress(item)}
        onFavoritePress={() => toggleFavorite(item.id)}
      />
    ),
    [favorites, handleChannelPress, toggleFavorite],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ChannelSection }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Channel) => item.url + item.id, []);

  const noSources = m3uUrls.length === 0 && xtreamSources.length === 0;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Search channels"
        />
        {loading && <ActivityIndicator size="small" color="#e63946" style={{ marginLeft: 8 }} />}
      </View>

      {/* Error banner */}
      {error !== null && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} numberOfLines={2}>
            {error.message}
          </Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {noSources && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No IPTV Sources</Text>
          <Text style={styles.emptySubtitle}>
            Add an M3U playlist URL or Xtream Codes server to see your channels.
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add Source</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Channel list */}
      {sections.length > 0 && (
        <SectionList<Channel, ChannelSection>
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
          removeClippedSubviews
          onRefresh={refresh}
          refreshing={loading}
          contentContainerStyle={styles.listContent}
          accessibilityLabel="IPTV channel list"
        />
      )}

      {/* Loading initial (no cached data yet) */}
      {loading && sections.length === 0 && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#e63946" />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      )}

      {/* FAB: Add source */}
      {!noSources && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          accessibilityLabel="Add IPTV source"
          accessibilityRole="button"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add source modal */}
      <AddSourceModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddM3U={(url) => void addM3USource(url)}
        onAddXtream={(server, username, password) =>
          void addXtreamSource({ server, username, password })
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = '#e63946';
const BG = '#0d0d0d';
const SURFACE = '#1a1a1a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#aaaaaa';
const BORDER = '#2a2a2a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  sectionHeaderText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    color: TEXT_SECONDARY,
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: BG,
  },
  logo: {
    width: 44,
    height: 30,
    borderRadius: 4,
    backgroundColor: SURFACE,
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '700',
  },
  rowContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  channelName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
  channelGroup: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
    marginRight: 10,
  },
  favoriteBtn: {
    padding: 4,
  },
  heart: {
    fontSize: 20,
    color: TEXT_SECONDARY,
  },
  heartActive: {
    color: ACCENT,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#700000',
  },
  errorText: {
    flex: 1,
    color: '#ff6b6b',
    fontSize: 13,
  },
  retryBtn: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: ACCENT,
    borderRadius: 6,
  },
  retryText: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: BG,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: TEXT_SECONDARY,
    fontSize: 20,
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 8,
    marginBottom: 20,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: ACCENT,
  },
  tabBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: TEXT_PRIMARY,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: SURFACE,
    color: TEXT_PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  addBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
});
