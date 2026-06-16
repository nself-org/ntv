# eas Build Flavors for nTV

## Overview

nTV supports two build variants using EAS Build profiles:
- **Free variant** (`eas build --profile free`): MIT FOSS, all standard features, bundle upsell UI visible
- **Bundle variant** (`eas build --profile bundle`): ɳTV bundle features enabled, license-gated functionality, upsell UI hidden

Both variants can coexist on the App Store with separate bundle IDs.

## Build Configuration

### eas.json Profiles

Two profiles are defined in `eas.json`:

```json
{
  "build": {
    "free": {
      "distribution": "store",
      "env": {
        "NSELF_BUNDLE": "false"
      },
      "ios": {
        "bundleIdentifier": "org.nself.ntv"
      },
      "android": {
        "buildType": "app-bundle",
        "applicationId": "org.nself.ntv"
      }
    },
    "bundle": {
      "distribution": "store",
      "env": {
        "NSELF_BUNDLE": "ntv"
      },
      "ios": {
        "bundleIdentifier": "org.nself.ntv.bundle"
      },
      "android": {
        "buildType": "app-bundle",
        "applicationId": "org.nself.ntv.bundle"
      }
    }
  }
}
```

### app.config.ts

The `app.config.ts` file reads `NSELF_BUNDLE` at build time and configures:
- App display name: "ɳTV" (free) or "ɳTV Bundle" (bundle)
- Bundle ID: `org.nself.ntv` (free) or `org.nself.ntv.bundle` (bundle)
- Package name: `org.nself.ntv` (free) or `org.nself.ntv.bundle` (bundle)
- Public env vars for runtime feature detection

## Runtime Feature Detection

### useNtvBundle Hook

Detect the active variant at runtime:

```typescript
import { useNtvBundle } from '@/hooks/useNtvBundle';

export function MyComponent() {
  const { isBundle } = useNtvBundle();
  
  if (isBundle) {
    return <BundleFeature />;
  }
  return <FreeFeature />;
}
```

### BundleStatusIndicator

Display the bundle status to the user:

```typescript
import { BundleStatusIndicator } from '@/components/BundleStatusIndicator';
import { useNtvBundle } from '@/hooks/useNtvBundle';

export function Header() {
  const { isBundle } = useNtvBundle();
  
  return (
    <BundleStatusIndicator 
      isBundle={isBundle}
      onUpsellingTap={() => navigateToUpgrade()}
    />
  );
}
```

#### Indicator States

- **Bundle Active** (isBundle=true): Green badge showing "ɳTV Bundle Active"
- **Bundle Inactive** (isBundle=false): Gray badge with "Get ɳTV" link

## Building

### Build Free Variant (Default)

```bash
eas build --platform all --profile free
```

Result: Binary named "ɳTV" with bundle ID `org.nself.ntv`.

### Build Bundle Variant

```bash
eas build --platform all --profile bundle
```

Result: Binary named "ɳTV Bundle" with bundle ID `org.nself.ntv.bundle`.

### Local Test Build

```bash
# Free variant
NSELF_BUNDLE=false eas build --platform ios --profile free --local

# Bundle variant
NSELF_BUNDLE=ntv eas build --platform ios --profile bundle --local
```

## CI/CD

GitHub Actions workflows build both variants:
- Free variant → App Store (org.nself.ntv)
- Bundle variant → App Store (org.nself.ntv.bundle)

Both are released simultaneously with matching version numbers.

## Feature Gating

### Free Variant Only

Features that require the bundle are hidden or show the upsell screen:

```typescript
import { useNtvBundle } from '@/hooks/useNtvBundle';

export function PremiumFeature() {
  const { isBundle } = useNtvBundle();
  
  if (!isBundle) {
    return <IapFallbackScreen />;
  }
  
  return <PremiumUI />;
}
```

### Bundle Variant Only

License-gated features are always visible in the bundle build.

## Testing

### Manual Testing

1. **Free build:** `eas build --profile free --local` → install → verify:
   - App name shows "ɳTV"
   - Bundle status indicator shows "Get ɳTV"
   - IAP fallback screen appears on premium features

2. **Bundle build:** `eas build --profile bundle --local` → install → verify:
   - App name shows "ɳTV Bundle"
   - Bundle status indicator shows "ɳTV Bundle Active"
   - Premium features are visible without upsell

### Automated Testing

Run the test suite to verify both profiles build without error:

```bash
pnpm test
```

## References

- `./../eas.json` — EAS build profile definitions
- `./app.config.ts` — Expo configuration with flavor support
- `./hooks/useNtvBundle.ts` — Runtime bundle detection
- `./components/BundleStatusIndicator.tsx` — Bundle status UI
- `./screens/IapFallbackScreen.tsx` — Upsell screen (T12)
- SPORT: F06-BUNDLE-INVENTORY.md, F07-PRICING-TIERS.md
