/**
 * Purpose: Shared StyleSheet for the ɳTV EPG grid sub-components.
 *          Extracted from EPGGridComponents.tsx to keep that file under 300 lines.
 *
 * Inputs: layout constants (ROW_HEIGHT, LOGO_COLUMN_WIDTH, TIMELINE_HEIGHT)
 *         imported from ./EPGGridConstants.
 * Outputs: `styles` — StyleSheet consumed by ProgramTile, ChannelRow,
 *          TimelineHeader, CurrentTimeMarker.
 *
 * Constraints: pure presentational styles; no business logic.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv EPG-grid-components
 */

import { StyleSheet } from 'react-native';
import { LOGO_COLUMN_WIDTH, ROW_HEIGHT, TIMELINE_HEIGHT } from './EPGGridConstants';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  logoColumn: {
    width: LOGO_COLUMN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRightWidth: 1,
    borderRightColor: '#333',
    padding: 4,
  },
  channelLogo: { width: 52, height: 36 },
  channelLogoPlaceholder: {
    width: 52,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 4,
  },
  channelLogoText: { color: '#aaa', fontSize: 9, textAlign: 'center' },
  programsScroll: { flex: 1 },
  timelineHeader: { height: TIMELINE_HEIGHT, position: 'relative' },
  timelineLabel: {
    position: 'absolute',
    top: 6,
    color: '#aaa',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  currentTimeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e53e3e',
    zIndex: 10,
  },
  programTile: {
    position: 'absolute',
    top: 4,
    height: ROW_HEIGHT - 8,
    backgroundColor: '#1e3a5f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  programTileCurrent: {
    backgroundColor: '#2b6cb0',
    borderLeftWidth: 3,
    borderLeftColor: '#63b3ed',
  },
  programTitle: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  programTime: { color: '#90cdf4', fontSize: 10, marginTop: 2 },
});
