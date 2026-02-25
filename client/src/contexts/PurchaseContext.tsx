import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Capacitor } from "@capacitor/core";
import { trpc } from "@/lib/trpc";

// ── Constants ────────────────────────────────────────────────────────────────

/** Auto-renewable subscription product ID — must match App Store Connect exactly. */
export const PURCHASE_PRODUCT_ID = "com.quintave.app.monthly";

/** RevenueCat entitlement identifier. */
export const ENTITLEMENT_ID = "pro";

/** RevenueCat public API keys (safe to bundle — not secret). */
const RC_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_IOS_KEY ?? "";
const RC_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_ANDROID_KEY ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchaseContextType {
  /** True if the user can access the app (trial active OR subscribed). */
  hasAccess: boolean;
  hasPurchased: boolean;
  trialDaysRemaining: number;
  trialActive: boolean;
  isLoading: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const confirmMutation = trpc.purchase.confirm.useMutation();

  // Server is the source of truth for both trial and purchase status.
  // Trial is calculated from createdAt (30 days) — tied to Google account,
  // so deleting and reinstalling the app does NOT reset the trial.
  const serverStatus = trpc.purchase.status.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hasPurchased = serverStatus.data?.hasPurchased ?? false;
  const trialActive = serverStatus.data?.trialActive ?? true;
  const trialDaysRemaining = serverStatus.data?.trialDaysRemaining ?? 30;
  const hasAccess = hasPurchased || trialActive;
  const isLoading = serverStatus.isLoading;

  const purchase = useCallback(async () => {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");

    const platform = Capacitor.getPlatform();
    const apiKey = platform === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

    if (!apiKey) throw new Error("RevenueCat API key not configured");

    await Purchases.configure({ apiKey });
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    if (!currentOffering) throw new Error("No offerings available");

    const pkg = currentOffering.availablePackages.find(
      p => p.product.identifier === PURCHASE_PRODUCT_ID
    );
    if (!pkg) throw new Error(`Product not found: ${PURCHASE_PRODUCT_ID}`);

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const isActive = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);

    if (isActive) {
      await confirmMutation.mutateAsync({
        revenueCatAppUserId: customerInfo.originalAppUserId,
      });
      await serverStatus.refetch();
    }
  }, [confirmMutation, serverStatus]);

  const restore = useCallback(async () => {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");

    const platform = Capacitor.getPlatform();
    const apiKey = platform === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    if (!apiKey) throw new Error("RevenueCat API key not configured");

    await Purchases.configure({ apiKey });

    const { customerInfo } = await Purchases.restorePurchases();
    const isActive = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);

    if (isActive) {
      await confirmMutation.mutateAsync({
        revenueCatAppUserId: customerInfo.originalAppUserId,
      });
      await serverStatus.refetch();
    }
  }, [confirmMutation, serverStatus]);

  const value = useMemo<PurchaseContextType>(
    () => ({ hasAccess, hasPurchased, trialActive, trialDaysRemaining, isLoading, purchase, restore }),
    [hasAccess, hasPurchased, trialActive, trialDaysRemaining, isLoading, purchase, restore]
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error("usePurchase must be used within PurchaseProvider");
  return ctx;
}
