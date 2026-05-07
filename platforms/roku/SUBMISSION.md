# Roku Channel Submission Guide

## Build the .zip package

```bash
cd platforms/roku
# Edit config/backend.txt with your nSelf backend URL before packaging
zip -r ntv-roku-<version>.zip manifest source/ images/ config/
```

## Sideload for testing

1. Enable Developer Mode on your Roku device: Home x3, Up x2, Right, Left, Right, Left, Right
2. Navigate to `http://<roku-ip>` in your browser
3. Upload the .zip under **Package Installer**

## CI artifact

The CI workflow (`release.yml` job `release-roku`) produces `ntv-roku-<tag>.zip` as a GitHub Release artifact.

## Submit to Roku Channel Store

1. Log in at [developer.roku.com](https://developer.roku.com)
2. Go to **Manage Channels** → **Add Channel** → **Developer SDK Channel**
3. Upload the .zip package
4. Complete store listing (description, screenshots, rating, pricing = Free)
5. Submit for review (~1-5 business days)

## Required store assets

| Asset | Size |
|---|---|
| Channel poster (focus state) | 540×405 px |
| Channel poster (side panel) | 214×144 px |
| Channel screenshots | 1920×1080 px (min 2) |
| Splash image | 1920×1080 px |

## Notes

- `config/backend.txt` must contain the user's nSelf backend URL. For Roku Channel Store submissions, ship with an onboarding screen that prompts for the URL instead of hardcoding.
- The CI package uses a placeholder URL. End users configure their backend via the on-device setup screen (planned v1.1.0).
