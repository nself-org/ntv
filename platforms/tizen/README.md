# nTV — Samsung Tizen

HTML5 wrapper app for Samsung Galaxy Store / Samsung Smart TV.

## Architecture

Wraps the nTV web frontend (ntv.nself.org or a self-hosted instance) inside a
Tizen HTML5 app. Remote-control key events are mapped to standard media keys and
forwarded into the iframe. No Flutter build required.

## Prerequisites

- **Samsung Tizen SDK** — install from https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html
- **Samsung TV Developer Account** — https://developer.samsung.com/galaxy-store/overview.html
  - Account registration: 1-2 weeks review turnaround

## Local Development

```bash
# Install Tizen CLI tools (bundled with Tizen Studio)
# Add tizen CLI to PATH: ~/tizen-studio/tools/ide/bin

# Build .wgt package
cd platforms/tizen
tizen build-web -- .

# Package as .wgt
tizen package -t wgt -- .build/

# Sideload to TV (TV must be in dev mode)
tizen install -n nTV.wgt -t <tv-device-id>
```

## Build Outputs

- `nTV.wgt` — Tizen Web Application package for Galaxy Store upload

## Self-Hosted URL Override

By default the app loads `https://ntv.nself.org`. To point to a self-hosted
instance, replace `%%NTV_BASE_URL%%` in `index.html` before packaging:

```bash
sed -i 's|%%NTV_BASE_URL%%|https://your-nself-server.example.com|g' index.html
```

Or set it during CI (see `release.yml` job `release-tizen`).

## Galaxy Store Submission

USER-ACTION REQUIRED — account registration must be completed first.

1. Create Samsung Developer account at https://developer.samsung.com
2. Enrol a Samsung Smart TV for testing
3. Submit `.wgt` via Seller Office: https://seller.samsungapps.com
4. Fill in store listing details from `store/STORE-LISTING.md`

## Status

🔒 USER-ACTION — Samsung Galaxy Store developer account not yet registered.
