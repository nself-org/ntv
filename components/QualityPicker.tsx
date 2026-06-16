/**
 * Purpose: HLS quality variant picker modal for nTV player.
 * Shows Auto + named variants; highlights currently selected quality.
 * Extracted from PlayerControls to keep files under 300 lines.
 *
 * Inputs:
 *   - qualities: StreamQuality[] — available HLS variants
 *   - selectedQualityIndex: number — active track index (-1 = auto)
 *   - onSelect(index): void — called when user picks a quality
 *   - onClose(): void — called to dismiss the modal
 *
 * Outputs:
 *   - Modal overlay with quality rows.
 *
 * Constraints:
 *   - Single-responsibility: render + selection only, no playback logic.
 */

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { StreamQuality } from '../hooks/useMediaPlayer';

type QualityPickerProps = {
  qualities: StreamQuality[];
  selectedQualityIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

export function QualityPicker({
  qualities,
  selectedQualityIndex,
  onSelect,
  onClose,
}: QualityPickerProps) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <Text style={styles.title}>Quality</Text>

              <TouchableOpacity
                style={styles.row}
                onPress={() => { onSelect(-1); onClose(); }}
              >
                <Text
                  style={[
                    styles.label,
                    selectedQualityIndex === -1 && styles.labelActive,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>

              {qualities.map((q) => (
                <TouchableOpacity
                  key={q.trackIndex}
                  style={styles.row}
                  onPress={() => { onSelect(q.trackIndex); onClose(); }}
                >
                  <Text
                    style={[
                      styles.label,
                      selectedQualityIndex === q.trackIndex && styles.labelActive,
                    ]}
                  >
                    {q.label}
                    {q.height ? ` (${q.height}p)` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  labelActive: {
    color: '#E53E3E',
    fontWeight: '700',
  },
});
