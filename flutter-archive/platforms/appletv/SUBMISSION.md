# Apple TV — TestFlight & App Store Submission

## CI artifact

The `release-appletv` CI job builds a tvOS .ipa and uploads to TestFlight automatically on tag push.

## Manual submission steps

1. Xcode → Archive (Product → Archive)
2. Distribute App → App Store Connect → Upload
3. In App Store Connect, create a new tvOS app with Bundle ID `org.nself.ntv.tv`
4. Add the build to TestFlight for internal testing
5. For public release: fill metadata, screenshots (1920×1080), and submit for review

## Required store assets

| Asset | Size |
|---|---|
| App icon | 1280×768 px (no alpha) |
| Screenshots | 1920×1080 px or 3840×2160 px (min 2) |
| Preview video | Optional — 1920×1080, 15-30s |

## Notes

- tvOS uses the same Flutter codebase as iOS. The `FLAVOR` env var differentiates at runtime.
- If `flutter build ipa` fails on tvOS, check `SETUP.md` for known issues and the fallback plan.
- Separate Bundle ID (`org.nself.ntv.tv`) required — App Store Connect treats iOS and tvOS as separate apps.
