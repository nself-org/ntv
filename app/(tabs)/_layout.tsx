/**
 * Purpose: Tab bar layout for ɳTV — defines five bottom tabs: Channels, EPG, Player,
 *          Favorites, Search, and Settings.
 * Outputs: Bottom tab navigator with icons and labels.
 * Constraints: Expo Router Tabs. Dark theme. All icons from @expo/vector-icons Ionicons.
 * SPORT: F12-REPO-TYPE-MAP.md ntv RN+Expo tab nav
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#7c3aed';
const INACTIVE_COLOR = '#6b7280';
const BG_COLOR = '#030712';

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: { backgroundColor: BG_COLOR, borderTopColor: '#1f2937' },
        headerStyle: { backgroundColor: BG_COLOR },
        headerTintColor: '#f9fafb',
      }}
    >
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="tv-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="epg"
        options={{
          title: 'EPG',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="player"
        options={{
          title: 'Player',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
