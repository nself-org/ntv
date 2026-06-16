/**
 * IAP Service for nTV Bundle purchases
 *
 * Purpose:
 * Manage in-app purchases via expo-in-app-purchases. Handles product lookups,
 * purchase initiation, receipt verification via nSelf backend, and restore purchases.
 * Never validates receipts client-side — all verification happens server-side.
 *
 * Inputs:
 * - Product IDs from App Store Connect / Play Console (ntv_bundle_monthly, ntv_bundle_annual)
 * - User JWT from auth context
 * - Backend endpoint /api/license/iap-verify
 *
 * Outputs:
 * - Product catalog (prices, descriptions)
 * - Purchase receipt (client-side only; sent to backend for verification)
 * - Restored purchases list
 * - License status updates (consumed by useIap hook)
 *
 * Constraints:
 * - Receipt verification MUST be server-side (never trust client receipts)
 * - Restore flow handles no-prior-purchase gracefully (no-op, no error)
 * - StoreKit sandbox configured in app.config.ts for dev builds
 *
 * SPORT:
 * - F06-BUNDLE-INVENTORY.md (product list: ntv_bundle_monthly, ntv_bundle_annual)
 * - F07-PRICING-TIERS.md (prices: $0.99/mo, $9.99/yr)
 */

import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';

/**
 * IAP product identifiers. Must match App Store Connect / Play Console.
 * Free variant (NSELF_BUNDLE=false) shows these for purchase.
 * Bundle variant (NSELF_BUNDLE=ntv) hides IAP flow entirely.
 */
export const IAP_PRODUCTS = {
  MONTHLY: 'ntv_bundle_monthly',
  ANNUAL: 'ntv_bundle_annual',
};

/**
 * Initialize IAP listener and ready the connection.
 * Call once at app startup.
 */
export async function initializeIAP(): Promise<void> {
  try {
    await InAppPurchases.connectAsync();
  } catch (error) {
    console.error('[IAP] Failed to initialize:', error);
    // Gracefully degrade — don't crash app if IAP unavailable
  }
}

/**
 * Fetch available products from the store.
 * Returns product details including price and description.
 * On error (region unavailable, etc.), returns empty array.
 */
export async function getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
  try {
    const response = await InAppPurchases.getProductsAsync(
      Object.values(IAP_PRODUCTS)
    );
    return response.results ?? [];
  } catch (error) {
    console.error('[IAP] Failed to fetch products:', error);
    return [];
  }
}

/**
 * Initiate a purchase for the given product ID.
 * Returns a Promise that resolves after the purchase flow is initiated.
 * The result arrives asynchronously via setPurchaseListener.
 * On user cancel or store error, resolves to null.
 */
export async function purchaseProduct(
  productId: string
): Promise<InAppPurchases.InAppPurchase | null> {
  return new Promise((resolve) => {
    InAppPurchases.setPurchaseListener((response) => {
      const purchase = response.results?.[0];
      if (purchase) {
        resolve(purchase);
      } else {
        resolve(null);
      }
    });

    InAppPurchases.purchaseItemAsync(productId).catch((error: unknown) => {
      const errCode = error instanceof Error
        ? (error as NodeJS.ErrnoException).code
        : undefined;
      if (errCode === 'E_USER_CANCELLED') {
        console.log('[IAP] User cancelled purchase');
      } else {
        console.error('[IAP] Purchase failed:', error);
      }
      resolve(null);
    });
  });
}

/**
 * Verify a purchase receipt with the nSelf backend.
 * Always call this server-side endpoint, never trust client-only validation.
 *
 * POST /api/license/iap-verify
 * {
 *   platform: 'ios' | 'android',
 *   receipt: transactionReceipt | playStoreToken,
 *   productId: string,
 * }
 *
 * Returns:
 * { success: true, license: { ... } } on valid purchase
 * { success: false, reason: string } on invalid/expired/already-claimed
 */
export async function verifyPurchaseWithBackend(
  product: InAppPurchases.InAppPurchase,
  productId: string,
  userJwt: string
): Promise<{ success: boolean; license?: unknown; reason?: string }> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const receipt = product.transactionReceipt || product.purchaseToken;

    if (!receipt) {
      return { success: false, reason: 'No receipt found' };
    }

    // Use nSelf GraphQL client or fetch directly with JWT
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_NSELF_API_URL || 'https://api.nself.org'}/license/iap-verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
          platform,
          receipt,
          productId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        reason: error.reason || 'Verification failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      license: data.license,
    };
  } catch (error) {
    console.error('[IAP] Backend verification error:', error);
    return {
      success: false,
      reason: 'Network error during verification',
    };
  }
}

/**
 * Restore previous purchases.
 * Call this when a user re-installs the app or wants to re-enable purchases.
 *
 * Returns list of previously purchased product IDs.
 * If no prior purchases exist, returns empty array (no error).
 */
export async function restorePurchases(
  userJwt: string
): Promise<string[]> {
  try {
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    const purchases = response.results ?? [];
    if (purchases.length === 0) {
      return [];
    }

    // Re-verify all restored purchases with backend
    const verified: string[] = [];
    for (const purchase of purchases) {
      const result = await verifyPurchaseWithBackend(
        purchase,
        purchase.productId,
        userJwt
      );
      if (result.success) {
        verified.push(purchase.productId);
      }
    }

    return verified;
  } catch (error) {
    console.error('[IAP] Restore purchases failed:', error);
    return [];
  }
}

/**
 * Disconnect IAP listener.
 * Call during app cleanup or sign-out.
 */
export async function disconnectIAP(): Promise<void> {
  try {
    await InAppPurchases.disconnectAsync();
  } catch (error) {
    console.error('[IAP] Failed to disconnect:', error);
  }
}
