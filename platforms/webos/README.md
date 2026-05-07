# nTV — LG webOS

HTML5 wrapper app for LG Content Store / LG Smart TV.

## Architecture

Wraps the nTV web frontend (ntv.nself.org or a self-hosted instance) inside a
webOS web app. Magic Remote pointer + remote-control key events are forwarded
into the iframe. No Flutter build required.

## Prerequisites

- **webOS TV CLI** (`ares-*` tools) — install from https://webostv.developer.lge.com/develop/tools/cli-installation
- **LG Developer Account** — https://webostv.developer.lge.com
- **LG Content Store Developer Account** — registration required before submission

## Local Development

```bash
# Install webOS TV CLI
npm install -g @webosose/ares-cli

# Package as .ipk
cd platforms/webos
ares-package .

# Sideload to TV (TV must be in dev mode — Settings > Software Info > press 1,2,3,4,5 five times)
ares-install --device <tv-device-name> org.nself.ntv_1.0.0_all.ipk

# Launch
ares-launch --device <tv-device-name> org.nself.ntv
```

## Build Outputs

- `org.nself.ntv_1.0.0_all.ipk` — webOS IPK package for LG Content Store upload

## Self-Hosted URL Override

By default the app loads `https://ntv.nself.org`. To point to a self-hosted
instance, replace `%%NTV_BASE_URL%%` in `index.html` before packaging:

```bash
sed -i 's|%%NTV_BASE_URL%%|https://your-nself-server.example.com|g' index.html
```

Or set it during CI (see `release.yml` job `release-webos`).

## LG Content Store Submission

USER-ACTION REQUIRED — account registration must be completed first.

1. Create LG Developer account at https://webostv.developer.lge.com
2. Register as a seller in the LG Seller Lounge: https://seller.lgappstv.com
3. Submit `.ipk` via Seller Lounge after testing on a real TV
4. Fill in store listing details from `store/STORE-LISTING.md`

## Status

🔒 USER-ACTION — LG Content Store developer account not yet registered.
