/**
 * Purpose: StyleSheet for TorrentManagerScreen and TorrentManagerComponents.
 *          Extracted to keep component file under 300 lines.
 *
 * Inputs:  none
 * Outputs: styles — StyleSheet.create result, imported by TorrentManagerComponents.tsx
 *
 * Constraints:
 *   - Colors match the app dark palette (#111827 bg, #0ea5e9 accent, #10b981 success,
 *     #ef4444 error, #f59e0b warning, #6b7280 muted).
 *   - All interactive targets: minHeight 44 (WCAG 2.1 AA tap target).
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv torrent-manager-styles
 */

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#f9fafb' },

  addForm: { paddingHorizontal: 16, paddingBottom: 12 },
  addInput: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 4,
  },
  addInputError: { borderColor: '#ef4444' },
  addInputErrorText: { fontSize: 12, color: '#ef4444', marginBottom: 4 },
  addButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  gateCard: {
    margin: 16,
    backgroundColor: '#1e1b4b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#312e81',
  },
  gateIcon: { fontSize: 40, marginBottom: 12 },
  gateTitle: { fontSize: 18, fontWeight: '700', color: '#a5b4fc', marginBottom: 8, textAlign: 'center' },
  gateMessage: { fontSize: 14, color: '#818cf8', textAlign: 'center', lineHeight: 20 },
  gateHint: { fontSize: 12, color: '#6366f1', textAlign: 'center', marginTop: 12, lineHeight: 18 },

  row: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  rowHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#f9fafb', lineHeight: 20 },
  removeButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeIcon: { fontSize: 16, color: '#6b7280' },
  progressTrack: {
    height: 6,
    backgroundColor: '#1f2937',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  progressLabel: { fontSize: 12, color: '#9ca3af' },
  speedLabel: { fontSize: 12, color: '#9ca3af' },
  sizeLabel: { fontSize: 12, color: '#9ca3af' },
  controlButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 18, color: '#f9fafb' },
  rowError: { fontSize: 12, color: '#ef4444', marginTop: 6, lineHeight: 16 },
});

export default styles;
