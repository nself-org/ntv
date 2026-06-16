# ɳTV Bundle — In-App Purchase (IAP) Upsell

## Overview

The ɳTV Bundle is the paid tier of the nTV app. Free users see:
- **Bundle Status Indicator** in Settings (green check when active, lock + upgrade link when inactive)
- **IAP Fallback Screen** when accessing bundle-gated features

The purchase flow uses **expo-in-app-purchases** (StoreKit 2 on iOS, Google Play Billing on Android) with server-side receipt verification via the nSelf backend.

## Architecture

### Two Build Variants

nTV ships in two variants controlled by `NSELF_BUNDLE` environment variable (set via EAS profiles):

| Variant | NSELF_BUNDLE | Bundle ID | App Name | Features |
|---------|--------------|-----------|----------|----------|
| **Free** | `false` | `org.nself.ntv` | ɳTV | IAP upsell visible, restore purchases enabled |
| **Bundle** | `ntv` | `org.nself.ntv.bundle` | ɳTV Bundle | IAP screen hidden, all bundle features enabled |

Both variants run the same codebase. The flavor is determined at **build time** (cannot change at runtime).

### Component Hierarchy

```
App (entrypoint)
├─ useNtvBundle()
│  └─ { isBundle: boolean } ← Build-time flavor flag
├─ useIap()
│  ├─ { products, isBundle: boolean } ← Runtime IAP state
│  ├─ { initiatePurchase(), restorePurchases() }
│  └─ Calls: iapService.ts
├─ BundleStatusIndicator
│  └─ Shows: active (green) or inactive (upgrade link)
└─ [FeatureGate] → if NSELF_BUNDLE=false
   └─ IapFallbackScreen (one of three states)
      ├─ regionUnavailable
      ├─ purchaseRestricted (parental controls)
      └─ subscriptionPending (awaiting app store verification)
```

## IAP Service (`src/services/iapService.ts`)

### Initialization

```typescript
import { initializeIAP, disconnectIAP } from '@/services/iapService';

useEffect(() => {
  initializeIAP();
  return () => disconnectIAP();
}, []);
```

### Product IDs

```typescript
// Must match App Store Connect + Play Console
export const IAP_PRODUCTS = {
  MONTHLY: 'ntv_bundle_monthly',   // $0.99/mo
  ANNUAL: 'ntv_bundle_annual',     // $9.99/yr
};
```

### Purchase Flow

1. **Fetch Products** → `getProducts()` returns prices from store
2. **User Initiates** → `purchaseProduct(productId)` opens platform store UI
3. **Completion** → Receipt returned to app
4. **Backend Verification** → `verifyPurchaseWithBackend()` POSTs receipt to `/api/license/iap-verify`
5. **License Update** → On success, `useIap` state updates, component re-renders

### Receipt Verification (Server-Side)

```typescript
POST /api/license/iap-verify
{
  "platform": "ios" | "android",
  "receipt": "<transaction receipt or play store token>",
  "productId": "ntv_bundle_monthly"
}

Response:
{
  "success": true,
  "license": { "active": true, "expiresAt": "2025-01-01T00:00:00Z" }
}
```

**Never validate receipts client-side.** The nSelf backend validates against Apple / Google servers.

### Restore Purchases

```typescript
const { restorePurchases } = useIap();

// User re-installed app or new device
await restorePurchases();
// → Fetches prior receipts, re-verifies with backend
// → If any valid, sets isBundle = true
```

## useIap Hook (`src/hooks/useIap.ts`)

```typescript
const {
  products,        // Available products from store
  isBundle,        // Current bundle status (flavor + purchased)
  isPurchasing,    // Loading during purchase
  isRestoring,     // Loading during restore
  error,           // Purchase/network error message
  initiatePurchase,
  restorePurchases,
} = useIap();
```

## BundleStatusIndicator (`src/components/BundleStatusIndicator.tsx`)

Rendered in Settings screen.

**Active:**
```
✓ ɳTV Bundle Active
```

**Inactive (free variant):**
```
🔒 Get ɳTV Bundle — $0.99/mo  [tap to purchase]
```

**Hidden (bundle variant):**
```
// Component not rendered at all
```

## IapFallbackScreen (`src/screens/IapFallbackScreen.tsx`)

Shown when a feature requires the bundle but it's not active (free variant only).

### Three States

#### 1. Region Unavailable
User's region doesn't support IAP.

```
Icon: 🌐 off (amber)
Title: "Bundle unavailable in your region"
Body: Can still use nTV with free M3U playlists
CTA: "Contact support" → https://chat.nself.org
```

#### 2. Purchase Restricted
Parental controls prevent purchases.

```
Icon: 👨‍👩‍👧‍👦 (blue)
Title: "Purchase restricted"
Body: Ask account owner to allow purchases; manage Settings
CTA: "Open device Settings"
```

#### 3. Subscription Pending
Purchase submitted but awaiting app store verification.

```
Icon: ⏳ (emerald)
Title: "Subscription pending verification"
Body: Usually completes within minutes; restart app to check
CTA: None (message-only)
```

## Build & Test

### Build Free Variant

```bash
eas build --platform ios --profile free --local
# or
eas build --platform all --profile free
```

App name: ɳTV  
Bundle ID: `org.nself.ntv`  
IAP: ✓ visible

### Build Bundle Variant

```bash
eas build --platform ios --profile bundle --local
eas build --platform all --profile bundle
```

App name: ɳTV Bundle  
Bundle ID: `org.nself.ntv.bundle`  
IAP: ✗ hidden (all bundle features enabled)

### StoreKit Sandbox Testing (iOS)

For development, `app.config.ts` sets StoreKit sandbox when not production:

```typescript
// app.config.ts
extra: {
  useStaging: process.env.EAS_BUILD_PROFILE !== 'production' ? 'true' : 'false',
}
```

**Sandbox Test Accounts:**  
Create at [App Store Connect → Sandbox Users](https://appstoreconnect.apple.com/)

**Testing Flow:**
1. Install dev build on simulator/device
2. In Settings, tap "Get ɳTV Bundle"
3. Choose product (monthly / annual)
4. Sign in with sandbox test account
5. Confirm purchase in StoreKit sandbox UI
6. Watch Xcode logs → POST to `/api/license/iap-verify`
7. Bundle Status Indicator changes to active ✓

### Google Play Sandbox Testing (Android)

Requires:
- App uploaded to Play Console (as draft or internal testing track)
- Test device added to tester list
- App installed from Play Console Internal Testing track

**Testing Flow:**
1. Install dev build from internal testing track
2. In Settings, tap "Get ɳTV Bundle"
3. Choose product
4. Confirm via Google Play Billing sandbox
5. Same server verification occurs
6. Bundle Status Indicator updates

## Pricing Tiers

| Tier | Price | Renewal |
|------|-------|---------|
| Monthly | $0.99 USD | Monthly, auto-renewing |
| Annual | $9.99 USD | Yearly, auto-renewing |

See `SPORT F07-PRICING-TIERS.md` for current canonical pricing.

## Failure Modes

### Network Error
Fallback message: "Network error during verification"  
→ User can retry or contact support

### Invalid Receipt
Fallback message: "Purchase verification failed. Please try again."  
→ May indicate:
  - Receipt already used
  - Subscription expired
  - Backend validation failed  
→ User should sign out / restore purchases / contact support

### No Prior Purchases (Restore)
`restorePurchases()` returns empty array gracefully  
→ No error shown; UX continues as normal

## Architecture Decisions

- **Server-side verification**: Never trust client receipts. Always verify on nSelf backend.
- **Separate bundle IDs**: Allows both variants on App Store simultaneously (different apps, different pricing).
- **Build-time flavor**: `NSELF_BUNDLE` set at EAS build time; cannot change at runtime. Flavor determines which screens/features render.
- **Graceful degradation**: If IAP unavailable (region, parental controls), users can still use free features or contact support.

## Related

- **T-P3-E4-W2-S4-T11** — Flavor system (EAS profiles, app.config.ts)
- **T-P3-E4-W2-S4-T09** — nTV parity check and EAS production builds
- **Feature Preservation Inventory** — IAP component ports from Flutter
- **@nself/auth-core** — JWT management for verified purchases
