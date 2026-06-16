/**
 * Purpose: Register push notifications (FCM/APNs), handle deep links, store user preferences.
 * Inputs:  none
 * Outputs: Hook with registerToken, requestPermission methods + reactive notification state.
 * Constraints: Expo Notifications v0.27+. Must register FCM/APNs token and attach listener.
 *              Deep links route via expo-router. User preferences (toggle recording_reminder, live_event_alert)
 *              persist to SecureStore.
 * SPORT: F12-REPO-TYPE-MAP.md (ntv row); T-P3-E4-W2-S4-T07
 */

import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export interface NotificationPreferences {
  recording_reminder: boolean;
  live_event_alert: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  recording_reminder: true,
  live_event_alert: true,
};

const PREFS_KEY = 'ntv.notification_prefs';

/**
 * Initialize and manage push notifications.
 *
 * Manages:
 * - Permission request on first call
 * - FCM/APNs token registration (logged in dev)
 * - Notification listener that deep-links on notification tap
 * - User preferences (persist to SecureStore)
 */
export function useNotifications(): {
  preferences: NotificationPreferences;
  setPreferences: (prefs: NotificationPreferences) => Promise<void>;
  requestPermission: () => Promise<boolean>;
} {
  const router = useRouter();
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  // Load preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(PREFS_KEY);
        if (stored) {
          setPreferencesState(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('[useNotifications] Failed to load preferences:', e);
      }
    })();
  }, []);

  // Request permission and register token
  useEffect(() => {
    (async () => {
      try {
        const result = await Notifications.requestPermissionsAsync();
        if (!result.granted) {
          console.log('[useNotifications] Permission denied');
          return;
        }

        const token = await Notifications.getExpoPushTokenAsync();
        console.log('[useNotifications] Token registered:', token.data);

        // Register notification response listener (deep link on tap)
        if (listenerRef.current) {
          listenerRef.current.remove();
        }
        listenerRef.current = Notifications.addNotificationResponseReceivedListener((event) => {
          const { notification } = event;
          const { data } = notification.request.content;
          const type = data?.type as string | undefined;

          if (type === 'recording_reminder') {
            router.push('/(tabs)/epg'); // Navigate to schedule tab
          } else if (type === 'live_event_alert') {
            const channelId = data?.channelId as string | undefined;
            if (channelId) {
              router.push(`/player/${channelId}`);
            }
          }
        });
      } catch (e) {
        console.error('[useNotifications] Setup failed:', e);
      }
    })();

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
    };
  }, [router]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      return result.granted;
    } catch (e) {
      console.error('[useNotifications] Permission request failed:', e);
      return false;
    }
  };

  const setPreferences = async (newPrefs: NotificationPreferences): Promise<void> => {
    try {
      await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(newPrefs));
      setPreferencesState(newPrefs);
    } catch (e) {
      console.error('[useNotifications] Failed to save preferences:', e);
      throw e;
    }
  };

  return {
    preferences,
    setPreferences,
    requestPermission,
  };
}
