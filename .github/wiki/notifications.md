# Push Notifications

nTV supports push notifications for recording reminders and live event alerts via expo-notifications (FCM on Android, APNs on iOS).

## Features

- Permission request in onboarding (requestPermissionsAsync)
- FCM/APNs token registration and logging (for backend server setup)
- Notification type handling: `recording_reminder` and `live_event_alert`
- Deep linking: recording reminders route to the schedule (EPG) tab; live event alerts route to the player with the specified channel ID
- User preference toggles (SecureStore persistence): disable/enable per notification type
- Integration with @nself/observability: Sentry error tracking + OTel performance spans on notification lifecycle

## Architecture

| File | Role |
|---|---|
| `src/hooks/useNotifications.ts` | Hook managing permission requests, token registration, listener lifecycle, and preference persistence |
| `src/hooks/__tests__/useNotifications.test.ts` | Unit tests covering all notification and preference flows |
| `app/+layout.tsx` | Sentry.init call (error/crash tracking), notif observer initialization via useNotifications hook |
| `app/(tabs)/settings.tsx` | Notification preference toggles (recording_reminder, live_event_alert) with SecureStore binding |

## Data Flow

1. **Initialization:** useNotifications hook runs on app boot, initializes expo-notifications, requests permission.
2. **Permission:** requestPermissionsAsync() prompts user. Result is logged.
3. **Token registration:** On permission grant, getExpoPushTokenAsync() fetches the FCM/APNs token and logs it (dev builds) for backend server registration.
4. **Notification listener:** addNotificationResponseReceivedListener watches for user taps. Extracts `type` and `channelId` (if present) from the notification payload, then routes via expo-router.
5. **Preferences:** User toggles in settings are persisted to SecureStore under key `ntv.notification_prefs` (JSON-serialized NotificationPreferences object).
6. **Observability:** Sentry.init in +layout.tsx tracks crashes and errors; OTel spans on channel load and playback measure performance.

## Notification Types

### recording_reminder
- **Payload shape:** `{ type: "recording_reminder", ... }`
- **Route:** `/(tabs)/epg` (schedule tab)
- **Backend trigger:** nTV plugin fires when a scheduled recording is about to start

### live_event_alert
- **Payload shape:** `{ type: "live_event_alert", channelId: "ch-<id>", ... }`
- **Route:** `/player/{channelId}` (opens live stream in player)
- **Backend trigger:** nTV plugin fires when a live event begins on a user-followed channel

## Preferences API

```typescript
interface NotificationPreferences {
  recording_reminder: boolean;
  live_event_alert: boolean;
}

// Hook usage:
const { preferences, setPreferences, requestPermission } = useNotifications();

// Update preferences:
await setPreferences({
  recording_reminder: false,
  live_event_alert: true,
});

// Request permission (if previously denied):
const granted = await requestPermission();
```

## Backend Integration

1. **Token registration:** The logged token (see console output in dev builds) must be registered with your nSelf backend's notification service (nTV plugin).
2. **Sending notifications:** The backend nTV plugin sends FCM/APNs payloads with the user's token, using the notification types defined above.
3. **Preference filtering:** The backend can optionally filter notifications based on user preferences (though client-side toggles are primary).

## Testing

### Unit Tests
```bash
pnpm test --testPathPattern="useNotifications"
```

All flows are mocked: permissions, token fetch, SecureStore, and routing. Coverage includes permission denial, token registration success/failure, deep-link routing, preference loading/saving, and listener cleanup.

### End-to-End (EAS + Test Push)

1. Build a debug APK or IPA via EAS.
2. Use Expo's push notification testing tool (or your nSelf backend admin panel) to send a test notification to the registered token.
3. Verify the notification arrives on the device.
4. Tap the notification and confirm the correct screen is displayed.

## Observability Integration

### Sentry
- Initialized in `app/+layout.tsx` with the nTV DSN (from `.env.example`: `SENTRY_NSTV_DSN`).
- Captures uncaught exceptions, permission request failures, token registration errors, and preference save errors.
- Verify in Sentry dashboard: events arriving under the nTV project.

### OpenTelemetry
- Span `channel.load` wraps the useChannelList hook fetch (tracks EPG data fetching).
- Span `player.playback` wraps video playback initialization (tracks playback latency).
- Spans exported to the configured OTel collector (nSelf backend).

## Out of Scope

- Push notification backend server logic (nTV plugin handles it).
- Analytics beyond error/performance (Umami analytics separate).
- Dynamic notification content customization (future enhancement).
- Notification sound/vibration customization (platform defaults used).
