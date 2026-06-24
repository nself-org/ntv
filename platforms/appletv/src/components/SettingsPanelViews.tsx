/**
 * Purpose: Sub-view components for the ɳTV Apple TV settings panel.
 *          Extracted from SettingsPanel.tsx to keep that file under 300 lines.
 *          Contains: RootMenu, SourcesView, AddSourceView, PlayerView, AboutView.
 *          Styles live in SettingsPanelStyles.ts (extracted to stay under 300 lines).
 *
 * Inputs:
 *   RootMenu      — onNavigate: (view: MenuView) => void
 *   SourcesView   — sources: string[], onAdd: () => void, onRemove: (url) => void
 *   AddSourceView — onSubmit: (url: string) => void, onCancel: () => void
 *
 * Outputs: TV-focus-navigable settings sub-screens. No state except AddSourceView.
 *
 * Constraints:
 *   - TV-only: no touch handlers; all interaction via D-pad / Siri Remote.
 *   - Text ≥24pt; contrast ≥6:1 against panel background.
 *   - TVFocusGuideView wraps all focusable menus.
 *   - hasTVPreferredFocus on first interactive element in each sub-view.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS settings panel views
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TVFocusGuideView,
  View,
} from 'react-native';
import { Platform } from 'react-native';
import { styles } from './SettingsPanelStyles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MenuView = 'root' | 'sources' | 'add-source' | 'player' | 'about';

export const VIEW_TITLES: Record<MenuView, string> = {
  root: 'Settings',
  sources: 'Sources',
  'add-source': 'Add Source',
  player: 'Player',
  about: 'About',
};

const APP_VERSION = '1.2.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim());
}

// ---------------------------------------------------------------------------
// RootMenu
// ---------------------------------------------------------------------------

interface RootMenuProps {
  onNavigate: (view: MenuView) => void;
}

export function RootMenu({ onNavigate }: RootMenuProps) {
  const items: { label: string; view: MenuView; icon: string }[] = [
    { label: 'Sources', view: 'sources', icon: '📡' },
    { label: 'Player', view: 'player', icon: '▶' },
    { label: 'About', view: 'about', icon: 'ℹ' },
  ];

  return (
    <TVFocusGuideView style={styles.menuGuide} trapFocusDown trapFocusUp>
      {items.map((item, index) => (
        <Pressable
          key={item.view}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — hasTVPreferredFocus is react-native-tvos only
          hasTVPreferredFocus={index === 0}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
          style={({ focused }: { focused: boolean }) => [
            styles.menuItem,
            focused ? styles.menuItemFocused : null,
          ]}
          onPress={() => onNavigate(item.view)}
          accessibilityLabel={item.label}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>
      ))}
    </TVFocusGuideView>
  );
}

// ---------------------------------------------------------------------------
// SourcesView
// ---------------------------------------------------------------------------

interface SourcesViewProps {
  sources: string[];
  onAdd: () => void;
  onRemove: (url: string) => void;
}

export function SourcesView({ sources, onAdd, onRemove }: SourcesViewProps) {
  return (
    <TVFocusGuideView style={styles.menuGuide} trapFocusDown trapFocusUp>
      <Pressable
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        hasTVPreferredFocus
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
        style={({ focused }: { focused: boolean }) => [
          styles.addBtn,
          focused ? styles.addBtnFocused : null,
        ]}
        onPress={onAdd}
        accessibilityLabel="Add M3U source"
      >
        <Text style={styles.addBtnText}>+ Add M3U Source</Text>
      </Pressable>

      {sources.length === 0 ? (
        <Text style={styles.emptyHint}>No sources added yet.</Text>
      ) : (
        <FlatList<string>
          data={sources}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.sourceRow}>
              <Text style={styles.sourceUrl} numberOfLines={1}>{item}</Text>
              <Pressable
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
                style={({ focused }: { focused: boolean }) => [
                  styles.removeBtn,
                  focused ? styles.removeBtnFocused : null,
                ]}
                onPress={() => onRemove(item)}
                accessibilityLabel={`Remove source ${item}`}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.sourceList}
        />
      )}
    </TVFocusGuideView>
  );
}

// ---------------------------------------------------------------------------
// AddSourceView
// ---------------------------------------------------------------------------

interface AddSourceViewProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

export function AddSourceView({ onSubmit, onCancel }: AddSourceViewProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    if (!isValidUrl(url)) {
      setError('Enter a valid http:// or https:// URL.');
      return;
    }
    setError('');
    Keyboard.dismiss();
    onSubmit(url.trim());
  }, [url, onSubmit]);

  return (
    <TVFocusGuideView style={styles.menuGuide} trapFocusDown trapFocusUp>
      <Text style={styles.addSourceLabel}>M3U Playlist URL</Text>

      <TextInput
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        hasTVPreferredFocus
        style={styles.urlInput}
        value={url}
        onChangeText={(text) => {
          setUrl(text);
          if (error) setError('');
        }}
        placeholder="https://example.com/playlist.m3u"
        placeholderTextColor="#475569"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        accessibilityLabel="M3U playlist URL input"
      />

      {error !== '' && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.addSourceActions}>
        <Pressable
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
          style={({ focused }: { focused: boolean }) => [
            styles.submitBtn,
            focused ? styles.submitBtnFocused : null,
          ]}
          onPress={handleSubmit}
          accessibilityLabel="Save M3U source"
        >
          <Text style={styles.submitBtnText}>Save</Text>
        </Pressable>

        <Pressable
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — focused is a react-native-tvos extension on PressableStateCallbackType
          style={({ focused }: { focused: boolean }) => [
            styles.cancelBtn,
            focused ? styles.cancelBtnFocused : null,
          ]}
          onPress={onCancel}
          accessibilityLabel="Cancel adding source"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </TVFocusGuideView>
  );
}

// ---------------------------------------------------------------------------
// PlayerView
// ---------------------------------------------------------------------------

export function PlayerView() {
  return (
    <View style={styles.menuGuide}>
      <Text style={styles.sectionText}>Player preferences will appear here.</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AboutView
// ---------------------------------------------------------------------------

export function AboutView() {
  return (
    <View style={styles.menuGuide}>
      <Text style={styles.aboutRow}>
        <Text style={styles.aboutKey}>App Version  </Text>
        <Text style={styles.aboutValue}>{APP_VERSION}</Text>
      </Text>
      <Text style={styles.aboutRow}>
        <Text style={styles.aboutKey}>Platform      </Text>
        <Text style={styles.aboutValue}>
          {Platform.OS === 'ios' ? 'Apple TV (tvOS)' : 'Android TV'}
        </Text>
      </Text>
      <Text style={styles.aboutRow}>
        <Text style={styles.aboutKey}>License       </Text>
        <Text style={styles.aboutValue}>MIT</Text>
      </Text>
    </View>
  );
}

// Styles live in ./SettingsPanelStyles.ts (extracted to keep this file <300 lines).
