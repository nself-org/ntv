# nTV — Code Signing & Distribution

**Scope:** `ntv/` (iOS + Android Flutter app)
**Parent standard:** `~/Sites/nself/.claude/docs/mobile-platform/MOBILE-PLATFORM-STANDARD.md`

This is the nTV-specific instantiation of the nSelf Mobile Platform Standard.
It never contains secrets. Secrets live in `~/.claude/vault.env` and GitHub Actions secrets.

---

## 1. Bundle IDs

| Platform | Bundle ID | Notes |
|---|---|---|
| iOS (main app) | `com.nself.ntv` | Must match AASA template (`ios/.well-known/apple-app-site-association-template.json`) |
| iOS (notification extension) | `com.nself.ntv.notifications` | Reserved; enable when push notifications are added |
| Android (application ID) | `com.nself.ntv` | Must match `android/.well-known/assetlinks-template.json` |

---

## 2. Vault variables

All secrets pulled from `~/.claude/vault.env` and mirrored into GitHub Actions secrets.

### iOS / Apple

| Vault var | Purpose |
|---|---|
| `APPLE_TEAM_ID` | Shared across nSelf apps; used in AASA + entitlements |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID for App Store Connect API |
| `APP_STORE_CONNECT_API_KEY_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_API_KEY_P8` | Base64 `.p8` key content |
| `MATCH_PASSWORD` | Decrypt password for match certs repo |
| `MATCH_GIT_URL` | Private git URL for match certs |
| `APNS_KEY_ID_NTV` | APNs auth key ID (scoped per nTV per platform standard §2.3) |
| `APNS_KEY_P8_NTV` | Base64 APNs `.p8` |

### Android / Google

| Vault var | Purpose |
|---|---|
| `ANDROID_KEYSTORE_PATH` | Path to release keystore (set by CI) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `PLAY_SERVICE_ACCOUNT_JSON_NTV` | Play Console service account |
| `FCM_SERVICE_ACCOUNT_JSON_NTV` | Firebase Admin SDK service account |

---

## 3. iOS setup workflow

1. Enrol `com.nself.ntv` in Apple Developer portal; enable Push Notifications and Associated Domains.
2. Configure associated domain: `applinks:ntv.nself.org`.
3. AASA file is rendered from `ios/.well-known/apple-app-site-association-template.json` by `web/scripts/render-aasa.sh` and served at `https://ntv.nself.org/.well-known/apple-app-site-association`.

### Entitlements

- Debug builds: `ios/Runner/Runner.entitlements` (`aps-environment=development`)
- Release/App Store builds: `ios/Runner/RunnerRelease.entitlements` (`aps-environment=production`)

---

## 4. Android setup workflow

1. Generate a release keystore (one-time, then store in vault):
   ```bash
   keytool -genkey -v \
     -keystore ntv-release.keystore \
     -alias ntv-release \
     -keyalg RSA -keysize 4096 -validity 10000
   ```
2. CI writes `key.properties` from vault secrets before `gradle assembleRelease`.
3. The `assetlinks-template.json` substitution is handled by `web/scripts/render-aasa.sh`.

---

## 5. Firebase placeholder configs

Placeholder Firebase config files are committed:
- `ios/Runner/GoogleService-Info.plist` — replace with real plist from Firebase Console
- `android/app/google-services.json` — replace with real JSON from Firebase Console

Both target the Firebase project `nself-ntv-prod` and bundle ID `com.nself.ntv`.

---

## 6. Never-commit policy

- `android/key.properties` is gitignored; only `key.properties.template` may be committed.
- Real API keys must never replace the `REPLACE_WITH_REAL_*` placeholders in committed config files.
- `APPLE_TEAM_ID` substitution happens only in CI via `render-aasa.sh`.

---

**Last updated:** 2026-04-20 (S52-T03: added Firebase placeholder configs, AASA + assetlinks templates, release signing config, iOS entitlements, NSUserNotificationsUsageDescription)
