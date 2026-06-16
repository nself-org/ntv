# Android TV — Play Store Submission

## CI artifact

The `release-androidtv` CI job builds a TV-specific AAB and uploads to the Play Store
**TV track** (internal track initially).

## Manual submission steps

1. Open [Google Play Console](https://play.google.com/console)
2. Select the **nTV** app (`org.nself.ntv`)
3. Go to **Release** → **Android TV** → **Internal testing**
4. Upload the AAB from CI (`build/app/outputs/bundle/tvRelease/*.aab`)
5. Add internal testers and roll out

## Promote to production

After successful TV internal testing:

1. **Android TV** track → Promote to **Production**
2. Separate phone production track is unaffected

## TV-specific store requirements

| Asset | Size |
|---|---|
| TV banner | 1280×720 px |
| TV screenshots | 1280×720 or 1920×1080 px (min 2) |
| Feature graphic | 1024×500 px (same as phone, reuse) |

## Notes

- The TV build uses the same `org.nself.ntv` package name as phone — Play Console handles TV and phone as separate tracks within the same app listing.
- `android.software.leanback required=true` causes the app to appear in the TV Play Store and be hidden from phone Play Store results.
- The `LEANBACK_LAUNCHER` category makes nTV appear on the Android TV home screen launcher row.
