/**
 * Purpose: Root component for nTV Apple TV / Android TV app.
 * Mounts TVEventHandler for Siri Remote / D-pad navigation and
 * renders the top-level navigation stack.
 *
 * Inputs: none
 * Outputs: React element tree for tvOS / Android TV
 *
 * Constraints:
 *   - No touch events — all interaction via focus + remote
 *   - react-native-tvos (not stock React Native) required
 *   - Platform.isTV guard on all shared-code branches
 *
 * SPORT: F12-REPO-TYPE-MAP.md (ntv/platforms/appletv → rn-tvos WIP)
 */

import React, { useEffect } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  TVEventHandler,
  View,
} from 'react-native';
import { HomeScreen } from '@/screens/HomeScreen';

if (!Platform.isTV) {
  throw new Error('[ntv-appletv] This app must run on a TV platform (tvOS or Android TV).');
}

export default function App(): React.JSX.Element {
  useEffect(() => {
    /**
     * TVEventHandler — wires Siri Remote / Android TV D-pad events.
     * Logs events in dev; production code handles focus-driven navigation.
     * MUST be removed on unmount to prevent memory leaks (CR-C).
     */
    const handler = new TVEventHandler();
    handler.enable(null, (_component, event) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[TVEvent]', event.eventType);
      }
    });

    return () => {
      handler.disable();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712', // gray-950
  },
});
