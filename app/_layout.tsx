/**
 * Purpose: Root layout for ɳTV Expo Router app.
 * Wraps the entire app with safe area context and expo-status-bar.
 * Outputs: Stack navigator root with single "(tabs)" stack entry.
 * Constraints: Expo Router v3+ file-based routing. Dark UI style.
 * SPORT: F12-REPO-TYPE-MAP.md ntv RN+Expo
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout(): React.ReactElement {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
