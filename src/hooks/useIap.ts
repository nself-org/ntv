/**
 * useIap Hook
 *
 * Purpose:
 * Manage IAP state for bundle purchase flow. Encapsulates product listing,
 * purchase completion, and license status updates.
 *
 * Inputs:
 * - User JWT from useAuth
 * - NSELF_BUNDLE env var (set by app.config.ts flavor system)
 *
 * Outputs:
 * - products: available products with prices
 * - isBundle: whether ɳTV Bundle is currently active
 * - isPurchasing: loading state during purchase
 * - error: purchase/fetch error message
 * - initiatePurchase(productId): start purchase flow
 * - restorePurchases(): re-verify prior purchases
 *
 * Side effects:
 * - Connects to IAP on mount
 * - Fetches products on mount
 * - Calls backend /api/license/iap-verify on purchase success
 * - Disconnects on unmount
 *
 * SPORT:
 * - F06-BUNDLE-INVENTORY.md (product identifiers)
 * - F07-PRICING-TIERS.md (display prices)
 */

import { useEffect, useState, useCallback } from 'react';
import * as InAppPurchases from 'expo-in-app-purchases';
import {
  initializeIAP,
  getProducts,
  purchaseProduct,
  verifyPurchaseWithBackend,
  restorePurchases,
  disconnectIAP,
  IAP_PRODUCTS,
} from '../services/iapService';
import { useAuth } from '@nself/auth-core';

export interface UseIapState {
  products: InAppPurchases.IAPItemDetails[];
  isBundle: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  initiatePurchase: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
}


/**
 * Hook for managing nTV Bundle IAP purchases.
 * Initialized automatically on first use.
 */
export function useIap(): UseIapState {
  const authState = useAuth();
  const jwt =
    authState.status === 'authenticated' ? authState.jwt : null;
  const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([]);
  const [isBundle, setIsBundle] = useState(
    process.env.EXPO_PUBLIC_NSELF_BUNDLE === 'ntv'
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize IAP on first mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeIAP();
        const prods: InAppPurchases.IAPItemDetails[] = await getProducts();
        setProducts(prods);
      } catch (err) {
        console.error('[useIap] Initialization failed:', err);
        setError('Failed to load purchase options');
      }
    };

    init();
    return () => {
      disconnectIAP().catch(() => {});
    };
  }, []);

  const initiatePurchase = useCallback(
    async (productId: string) => {
      if (!jwt) {
        setError('Sign in required to purchase');
        return;
      }

      setIsPurchasing(true);
      setError(null);

      try {
        const receipt = await purchaseProduct(productId);

        if (!receipt) {
          // User cancelled
          setIsPurchasing(false);
          return;
        }

        // Verify with backend
        const result = await verifyPurchaseWithBackend(
          receipt,
          productId,
          jwt
        );

        if (result.success) {
          // Purchase verified — update local state
          setIsBundle(true);
          setError(null);
        } else {
          setError(
            result.reason || 'Purchase verification failed. Please try again.'
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Purchase failed. Try again.'
        );
      } finally {
        setIsPurchasing(false);
      }
    },
    [jwt]
  );

  const handleRestorePurchases = useCallback(async () => {
    if (!jwt) {
      setError('Sign in required to restore purchases');
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      const restored = await restorePurchases(jwt);
      if (restored.length > 0) {
        // At least one purchase restored
        setIsBundle(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to restore purchases'
      );
    } finally {
      setIsRestoring(false);
    }
  }, [jwt]);

  return {
    products,
    isBundle,
    isPurchasing,
    isRestoring,
    error,
    initiatePurchase,
    restorePurchases: handleRestorePurchases,
  };
}
