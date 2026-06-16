/**
 * Purpose: Slide-in settings panel for nTV Apple TV / Android TV.
 * Provides a nested TV-focus menu with three top-level sections:
 *   1. Sources — list of M3U URLs; "Add source" entry opens TextInput
 *      (TV soft keyboard) for URL entry; "Remove" deletes a source.
 *   2. Player — player preferences (placeholder for future prefs).
 *   3. About — app version info.
 * All interaction via D-pad / Siri Remote — no touch.
 * "menu" remote button navigates back (submenu → root menu, root → close panel).
 *
 * Inputs:
 *   visible      — whether the panel is currently open.
 *   m3uSources   — current list of saved M3U source URLs.
 *   onAddSource  — called with a new M3U URL when the user submits.
 *   onRemoveSource — called with the URL to remove.
 *   onClose      — called when the panel should close.
 *
 * Outputs: Absolute slide-in settings panel with nested menu and on-screen keyboard.
 *
 * Constraints:
 *   - No touch gestures. All interaction via D-pad / Siri Remote.
 *   - TextInput for URL entry: TV soft keyboard appears automatically on focus.
 *   - hasTVPreferredFocus on first menu item so focus lands there on open.
 *   - TVFocusGuideView wraps the menu to trap focus inside the panel.
 *   - Text ≥24pt; contrast ≥6:1 against panel background.
 *   - "menu" button navigates back within the panel or closes it.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS settings panel (T-P3-E4-W2-S5-T04)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TVEventHandler,
  TVFocusGuideView,
  View,
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsPanelProps {
  /** Whether the panel is visible/open. */
  visible: boolean;
  /** Current list of saved M3U source URLs. */
  m3uSources?: string[];
  /** Called with the new URL string when the user submits an M3U source. */
  onAddSource?: (url: string) => void;
  /** Called with the URL to remove when the user selects a source for deletion. */
  onRemoveSource?: (url: string) => void;
  /** Called when the panel should close. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 560;
const SLIDE_DURATION_MS = 220;
const APP_VERSION = '1.2.0';

type MenuView = 'root' | 'sources' | 'add-source' | 'player' | 'about';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validates that a string looks like an HTTP/HTTPS URL before storing. */
function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim());
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

/** Root-level settings menu — Sources / Player / About */
interface RootMenuProps {
  onNavigate: (view: MenuView) => void;
}

function RootMenu({ onNavigate }: RootMenuProps) {
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

/** Sources sub-screen — lists M3U URLs + "Add source" button */
interface SourcesViewProps {
  sources: string[];
  onAdd: () => void;
  onRemove: (url: string) => void;
}

function SourcesView({ sources, onAdd, onRemove }: SourcesViewProps) {
  return (
    <TVFocusGuideView style={styles.menuGuide} trapFocusDown trapFocusUp>
      {/* Add source button — hasTVPreferredFocus so focus lands here first */}
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

      {/* Existing sources */}
      {sources.length === 0 ? (
        <Text style={styles.emptyHint}>No sources added yet.</Text>
      ) : (
        <FlatList<string>
          data={sources}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.sourceRow}>
              <Text style={styles.sourceUrl} numberOfLines={1}>
                {item}
              </Text>
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

/** Add-source sub-screen — TextInput for M3U URL entry via TV soft keyboard */
interface AddSourceViewProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

function AddSourceView({ onSubmit, onCancel }: AddSourceViewProps) {
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

      {/*
       * TextInput on TV: the soft keyboard appears automatically when this
       * element receives focus. The user types via the on-screen keyboard.
       * hasTVPreferredFocus ensures focus arrives here on mount.
       */}
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

      {/* Action buttons */}
      <View style={styles.addSourceActions}>
        {/* Submit button — hasTVPreferredFocus after TextInput submits */}
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

/** Player prefs sub-screen (placeholder for future settings) */
function PlayerView() {
  return (
    <View style={styles.menuGuide}>
      <Text style={styles.sectionText}>Player preferences will appear here.</Text>
    </View>
  );
}

/** About sub-screen */
function AboutView() {
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

// ---------------------------------------------------------------------------
// View title map
// ---------------------------------------------------------------------------

const VIEW_TITLES: Record<MenuView, string> = {
  root: 'Settings',
  sources: 'Sources',
  'add-source': 'Add Source',
  player: 'Player',
  about: 'About',
};

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

/**
 * Slide-in settings panel with nested TV-focus navigation.
 * Slides in from the right. "menu" remote button navigates back through
 * submenus; at the root menu it closes the panel entirely.
 */
export function SettingsPanel({
  visible,
  m3uSources = [],
  onAddSource,
  onRemoveSource,
  onClose,
}: SettingsPanelProps): React.JSX.Element | null {
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [currentView, setCurrentView] = useState<MenuView>('root');
  const isVisibleRef = useRef(false);

  // --- Reset to root menu when panel reopens ---
  useEffect(() => {
    if (visible) {
      setCurrentView('root');
    }
  }, [visible]);

  // --- Slide animation ---
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    isVisibleRef.current = visible;
  }, [visible, translateX]);

  // --- TVEventHandler: intercept "menu" for back-nav / close ---
  useEffect(() => {
    if (!Platform.isTV || !visible) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      if (evt.eventType === 'menu') {
        setCurrentView((prev) => {
          if (prev === 'root') {
            // At root — close the panel
            onClose();
            return 'root';
          }
          if (prev === 'add-source') {
            return 'sources';
          }
          return 'root';
        });
      }
    });

    return () => {
      handler.disable();
    };
  }, [visible, onClose]);

  const handleNavigate = useCallback((view: MenuView) => {
    setCurrentView(view);
  }, []);

  const handleAddSource = useCallback(
    (url: string) => {
      onAddSource?.(url);
      setCurrentView('sources');
    },
    [onAddSource],
  );

  const handleRemoveSource = useCallback(
    (url: string) => {
      onRemoveSource?.(url);
    },
    [onRemoveSource],
  );

  // Render nothing when fully offscreen and not animating
  if (!visible && !isVisibleRef.current) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateX }] }]}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      accessible={false}
    >
      {/* Panel header */}
      <View style={styles.header}>
        {currentView !== 'root' && (
          <Text style={styles.backHint}>‹ Press menu to go back</Text>
        )}
        <Text style={styles.headerTitle}>{VIEW_TITLES[currentView]}</Text>
      </View>

      {/* Sub-view rendering */}
      {currentView === 'root' && (
        <RootMenu onNavigate={handleNavigate} />
      )}
      {currentView === 'sources' && (
        <SourcesView
          sources={m3uSources}
          onAdd={() => handleNavigate('add-source')}
          onRemove={handleRemoveSource}
        />
      )}
      {currentView === 'add-source' && (
        <AddSourceView
          onSubmit={handleAddSource}
          onCancel={() => handleNavigate('sources')}
        />
      )}
      {currentView === 'player' && <PlayerView />}
      {currentView === 'about' && <AboutView />}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles — high-contrast palette for 3 m TV viewing distance
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // --- Panel container ---
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0f172a', // slate-900
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 48,
    paddingHorizontal: 36,
  },
  // --- Header ---
  header: {
    marginBottom: 32,
  },
  backHint: {
    fontSize: 18,
    color: '#64748b', // slate-500
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 36, // ≥24pt
    fontWeight: '700',
    color: '#f1f5f9', // slate-100 — contrast ≥18:1 on slate-900
  },
  // --- Menu ---
  menuGuide: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  menuItemFocused: {
    backgroundColor: '#1e293b', // slate-800
    borderColor: '#0ea5e9', // sky-500
    transform: [{ scale: 1.02 }],
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 28, // ≥24pt
    fontWeight: '500',
    color: '#f1f5f9',
  },
  menuChevron: {
    fontSize: 32,
    color: '#475569', // slate-600
  },
  // --- Sources view ---
  addBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#334155',
  },
  addBtnFocused: {
    backgroundColor: '#1d4ed8', // blue-700
    borderColor: '#60a5fa', // blue-400
    transform: [{ scale: 1.02 }],
  },
  addBtnText: {
    fontSize: 26, // ≥24pt
    fontWeight: '600',
    color: '#f1f5f9',
  },
  sourceList: {
    paddingBottom: 32,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sourceUrl: {
    flex: 1,
    fontSize: 22,
    color: '#94a3b8', // slate-400
    marginRight: 16,
  },
  removeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  removeBtnFocused: {
    backgroundColor: '#7f1d1d', // red-900
    borderColor: '#f87171', // red-400
  },
  removeBtnText: {
    fontSize: 20,
    color: '#f87171', // red-400 — sufficient contrast on dark bg
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 24, // ≥24pt
    color: '#475569',
    paddingTop: 16,
    fontStyle: 'italic',
  },
  // --- Add source view ---
  addSourceLabel: {
    fontSize: 24, // ≥24pt
    fontWeight: '600',
    color: '#94a3b8', // slate-400
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  urlInput: {
    fontSize: 26, // ≥24pt
    color: '#f1f5f9',
    backgroundColor: '#1e293b',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 22,
    color: '#f87171', // red-400
    marginBottom: 16,
  },
  addSourceActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: '#1d4ed8', // blue-700
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  submitBtnFocused: {
    backgroundColor: '#1e40af', // blue-800
    borderColor: '#60a5fa', // blue-400
    transform: [{ scale: 1.02 }],
  },
  submitBtnText: {
    fontSize: 26, // ≥24pt
    fontWeight: '700',
    color: '#f9fafb',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  cancelBtnFocused: {
    backgroundColor: '#334155',
    borderColor: '#94a3b8',
  },
  cancelBtnText: {
    fontSize: 26, // ≥24pt
    fontWeight: '600',
    color: '#94a3b8', // slate-400
  },
  // --- Player / About ---
  sectionText: {
    fontSize: 26, // ≥24pt
    color: '#94a3b8',
    paddingTop: 24,
  },
  aboutRow: {
    fontSize: 26, // ≥24pt
    color: '#f1f5f9',
    marginBottom: 20,
  },
  aboutKey: {
    color: '#64748b', // slate-500
    fontWeight: '400',
  },
  aboutValue: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
});
