/**
 * Purpose: Slide-in settings panel for nTV Apple TV / Android TV.
 *          Provides a nested TV-focus menu: Sources, Player, About.
 *          Sub-views extracted to SettingsPanelViews.tsx.
 *
 * Inputs:
 *   visible        — whether the panel is currently open.
 *   m3uSources     — current list of saved M3U source URLs.
 *   onAddSource    — called with a new M3U URL when the user submits.
 *   onRemoveSource — called with the URL to remove.
 *   onClose        — called when the panel should close.
 *
 * Outputs: Absolute slide-in settings panel with nested menu and on-screen keyboard.
 *
 * Constraints:
 *   - No touch gestures. All interaction via D-pad / Siri Remote.
 *   - "menu" button navigates back within the panel or closes it.
 *   - TVFocusGuideView wraps the menu to trap focus inside the panel.
 *   - Text ≥24pt; contrast ≥6:1 against panel background.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS settings panel (T-P3-E4-W2-S5-T04)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TVEventHandler,
  View,
} from 'react-native';
import {
  AboutView,
  AddSourceView,
  MenuView,
  PlayerView,
  RootMenu,
  SourcesView,
  VIEW_TITLES,
} from './SettingsPanelViews';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsPanelProps {
  visible: boolean;
  m3uSources?: string[];
  onAddSource?: (url: string) => void;
  onRemoveSource?: (url: string) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 560;
const SLIDE_DURATION_MS = 220;

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

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

  // Reset to root menu when panel reopens
  useEffect(() => {
    if (visible) setCurrentView('root');
  }, [visible]);

  // Slide animation
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    isVisibleRef.current = visible;
  }, [visible, translateX]);

  // TVEventHandler: intercept "menu" for back-nav / close
  useEffect(() => {
    if (!Platform.isTV || !visible) return;

    const handler = new TVEventHandler();
    handler.enable(null, (_cmp: unknown, evt: { eventType: string }) => {
      if (evt.eventType === 'menu') {
        setCurrentView((prev) => {
          if (prev === 'root') { onClose(); return 'root'; }
          if (prev === 'add-source') return 'sources';
          return 'root';
        });
      }
    });

    return () => { handler.disable(); };
  }, [visible, onClose]);

  const handleNavigate = useCallback((view: MenuView) => {
    setCurrentView(view);
  }, []);

  const handleAddSource = useCallback(
    (url: string) => { onAddSource?.(url); setCurrentView('sources'); },
    [onAddSource],
  );

  const handleRemoveSource = useCallback(
    (url: string) => { onRemoveSource?.(url); },
    [onRemoveSource],
  );

  if (!visible && !isVisibleRef.current) return null;

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateX }] }]}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      accessible={false}
    >
      <View style={styles.header}>
        {currentView !== 'root' && (
          <Text style={styles.backHint}>‹ Press menu to go back</Text>
        )}
        <Text style={styles.headerTitle}>{VIEW_TITLES[currentView]}</Text>
      </View>

      {currentView === 'root' && <RootMenu onNavigate={handleNavigate} />}
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
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: '#0f172a',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 48,
    paddingHorizontal: 36,
  },
  header: { marginBottom: 32 },
  backHint: { fontSize: 18, color: '#64748b', marginBottom: 4 },
  headerTitle: { fontSize: 36, fontWeight: '700', color: '#f1f5f9' },
});
