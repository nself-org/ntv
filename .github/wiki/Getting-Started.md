# Getting Started

**Status:** Active

By the end of this guide you will:

- Have an nSelf backend running with the nTV plugin bundle.
- Have nTV launched and connected to that backend.

## Prerequisites

- **Flutter 3.10+** — install: [flutter.dev/install](https://docs.flutter.dev/get-started/install)
- **Dart 3.0+** — installed with Flutter.
- **nSelf CLI** (latest stable) — install: [nself-org/cli](https://github.com/nself-org/cli/wiki/Installation)
- **A self-hosted nSelf backend** — local Docker Desktop is fine for testing. See `nself init` workflow.
- **An nSelf license key** — required for the nTV plugin bundle ($0.99/mo per F06). Get one at nself.org once cloud signup ships.

## Steps

### Step 1 — Bootstrap the backend

Spin up a local nSelf backend.

```bash
nself init my-ntv-stack
cd my-ntv-stack
nself license set <your-key>
nself plugin install media-processing streaming epg tmdb
nself build
nself start
```

Expected outcome: a backend running on `https://localhost` with Hasura + the nTV plugins.

### Step 2 — Clone nTV

```bash
git clone https://github.com/nself-org/ntv.git
cd ntv
flutter pub get
```

Expected outcome: dependencies fetched. `flutter doctor` passes.

### Step 3 — Add platform scaffolds

The repo currently ships without `ios/`, `android/`, `macos/`, `linux/`, `windows/`, `web/`. Run:

```bash
flutter create .
```

This adds platform code without touching `lib/`. Commit the result.

### Step 4 — Run the app

Pick a platform you have a build target for. macOS first per Phase 1:

```bash
flutter run -d macos
```

### Step 5 — Configure the backend connection

On first launch, nTV opens the Settings screen:

- Backend URL: `https://localhost` (or your remote backend URL)
- Email + password: your nSelf account credentials

The app saves a JWT and routes to the Library screen.

## Verification

Library screen renders a list of titles fetched from your backend. Tapping a title opens the Player screen and playback starts.

If any step fails, see [[Backend-Setup]] § Troubleshooting.

## Troubleshooting

### "No backend reachable"

**Symptom:** Settings screen reports it cannot reach the URL.
**Cause:** Backend is not running, URL is wrong, or local Docker is not bound to `localhost`.
**Fix:** `nself ls` should show running services. Confirm the URL in your `.env`.

### "Missing plugin: streaming"

**Symptom:** Library loads but Player fails with a plugin-missing error.
**Cause:** The nTV bundle's `streaming` plugin is not installed on the backend.
**Fix:** `nself plugin install streaming && nself build && nself start`.

## Next Steps

- [[Backend-Setup]] — full nTV install reference
- [[Architecture]] — system architecture overview
- [[Contributing]] — help build nTV

← [[Home]]
