/**
 * Purpose: Tab navigator layout — 5 tabs: Channels, EPG, Favorites, Search, Settings.
 * Inputs:  none
 * Outputs: Expo Router Tabs with branded bottom tab bar
 * Constraints: Matches feature-spec §5 tab count (5 tabs). Dark theme only.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row)
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Channels', icon: 'tv-outline', iconFocused: 'tv' },
  { name: 'epg', title: 'Guide', icon: 'calendar-outline', iconFocused: 'calendar' },
  { name: 'favorites', title: 'Favorites', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'search', title: 'Search', icon: 'search-outline', iconFocused: 'search' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1f2937',
        },
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      {TABS.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? iconFocused : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
