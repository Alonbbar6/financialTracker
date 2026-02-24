import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  hasPurchased: boolean;
  isLoading: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const confirmMutation = trpc.purchase.confirm.useMutation();

  // On web: rely on the server-side purchase status
  const serverStatus = trpc.purchase.status.useQuery(undefined, {
    enabled: !Capacitor.isNativePlatform(),
  });

  // Sync server status to local state (web path)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() && !serverStatus.isLoading) {
      setHasPurchased(serverStatus.data?.hasPurchased ?? false);
      setIsLoading(false);
    }
  }, [serverStatus.data, serverStatus.isLoading]);

  // Initialize RevenueCat and check entitlement (native path)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      try {
        const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");

        const platform = Capacitor.getPlatform();
        const apiKey = platform === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

        if (!apiKey) {
          console.error("[Purchase] No RevenueCat API key for platform:", platform);
          setIsLoading(false);
          return;
        }

        await Purchases.configure({ apiKey });

        if (import.meta.env.DEV) {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        }

        await checkEntitlement();
      } catch (err) {
        console.error("[Purchase] Init failed:", err);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const checkEntitlement = useCallback(async () => {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.getCustomerInfo();
      const isActive = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
      setHasPurchased(isActive);
    } catch (err) {
      console.error("[Purchase] Entitlement check failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = useCallback(async () => {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");

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
      setHasPurchased(true);
      // Sync to backend so the server also knows
      await confirmMutation.mutateAsync({
        revenueCatAppUserId: customerInfo.originalAppUserId,
      });
    }
  }, [confirmMutation]);

  const restore = useCallback(async () => {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const isActive = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);
    setHasPurchased(isActive);

    if (isActive) {
      await confirmMutation.mutateAsync({
        revenueCatAppUserId: customerInfo.originalAppUserId,
      });
    }
  }, [confirmMutation]);

  const value = useMemo<PurchaseContextType>(
    () => ({ hasPurchased, isLoading, purchase, restore }),
    [hasPurchased, isLoading, purchase, restore]
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
