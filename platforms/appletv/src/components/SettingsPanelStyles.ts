/**
 * Purpose: Shared StyleSheet for the ɳTV Apple TV settings panel sub-views.
 *          Extracted from SettingsPanelViews.tsx to keep that file under 300 lines.
 *
 * Inputs: none (static StyleSheet).
 * Outputs: `styles` — StyleSheet object consumed by RootMenu, SourcesView,
 *          AddSourceView, PlayerView, AboutView.
 *
 * Constraints:
 *   - TV-only: text ≥24pt; contrast ≥6:1 against panel background.
 *   - Focused variants drive D-pad / Siri Remote focus affordances.
 *
 * SPORT: F12-REPO-TYPE-MAP.md — ntv tvOS settings panel views
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  menuGuide: { flex: 1 },
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
    backgroundColor: '#1e293b',
    borderColor: '#0ea5e9',
    transform: [{ scale: 1.02 }],
  },
  menuIcon: { fontSize: 24, marginRight: 16, width: 32, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 28, fontWeight: '500', color: '#f1f5f9' },
  menuChevron: { fontSize: 32, color: '#475569' },

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
    backgroundColor: '#1d4ed8',
    borderColor: '#60a5fa',
    transform: [{ scale: 1.02 }],
  },
  addBtnText: { fontSize: 26, fontWeight: '600', color: '#f1f5f9' },
  sourceList: { paddingBottom: 32 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sourceUrl: { flex: 1, fontSize: 22, color: '#94a3b8', marginRight: 16 },
  removeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  removeBtnFocused: { backgroundColor: '#7f1d1d', borderColor: '#f87171' },
  removeBtnText: { fontSize: 20, color: '#f87171', fontWeight: '600' },
  emptyHint: { fontSize: 24, color: '#475569', paddingTop: 16, fontStyle: 'italic' },

  addSourceLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  urlInput: {
    fontSize: 26,
    color: '#f1f5f9',
    backgroundColor: '#1e293b',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 8,
  },
  errorText: { fontSize: 22, color: '#f87171', marginBottom: 16 },
  addSourceActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  submitBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  submitBtnFocused: {
    backgroundColor: '#1e40af',
    borderColor: '#60a5fa',
    transform: [{ scale: 1.02 }],
  },
  submitBtnText: { fontSize: 26, fontWeight: '700', color: '#f9fafb' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  cancelBtnFocused: { backgroundColor: '#334155', borderColor: '#94a3b8' },
  cancelBtnText: { fontSize: 26, fontWeight: '600', color: '#94a3b8' },

  sectionText: { fontSize: 26, color: '#94a3b8', paddingTop: 24 },
  aboutRow: { fontSize: 26, color: '#f1f5f9', marginBottom: 20 },
  aboutKey: { color: '#64748b', fontWeight: '400' },
  aboutValue: { color: '#f1f5f9', fontWeight: '600' },
});
