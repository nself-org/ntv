/**
 * Purpose: Tab navigator layout — 5 tabs: Channels, EPG, Favorites, Search, Settings.
 * Inputs:  none
 * Outputs: Expo Router Tabs with branded bottom tab bar
 * Constraints: Matches feature-spec §5 tab count (5 tabs). Dark theme only.
 *              All tab titles are i18n-wrapped via useNselfTranslation hook.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row)
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNselfTranslation } from '@nself/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  titleKey: string;
  icon: IconName;
  iconFocused: IconName;
}

const TABS: TabConfig[] = [
  { name: 'index', titleKey: 'channels', icon: 'tv-outline', iconFocused: 'tv' },
  { name: 'epg', titleKey: 'guide', icon: 'calendar-outline', iconFocused: 'calendar' },
  { name: 'favorites', titleKey: 'favorites', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'search', titleKey: 'search', icon: 'search-outline', iconFocused: 'search' },
  { name: 'settings', titleKey: 'settings', icon: 'settings-outline', iconFocused: 'settings' },
];

export default function TabsLayout(): React.ReactElement {
  const { t } = useNselfTranslation();

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
      {TABS.map(({ name, titleKey, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(titleKey as any),
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? iconFocused : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
