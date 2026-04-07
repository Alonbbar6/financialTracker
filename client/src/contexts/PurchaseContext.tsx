import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Capacitor } from "@capacitor/core";

// ── Constants ────────────────────────────────────────────────────────────────

/** Must match the Product ID in App Store Connect exactly. */
export const PURCHASE_PRODUCT_ID = "com.quintave.app.lifetime";

/** localStorage key — marks the purchase as owned on this device. */
const PURCHASED_KEY = "qt_purchased";

/** localStorage key storing the first-launch ISO timestamp. */
const FIRST_LAUNCH_KEY = "qt_first_launch";

/** Free trial length in days. */
const TRIAL_DAYS = 7;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchaseContextType {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrSetFirstLaunch(): Date {
  const stored = localStorage.getItem(FIRST_LAUNCH_KEY);
  if (stored) return new Date(stored);
  const now = new Date().toISOString();
  localStorage.setItem(FIRST_LAUNCH_KEY, now);
  return new Date(now);
}

function computeTrial(): { trialActive: boolean; trialDaysRemaining: number } {
  const firstLaunch = getOrSetFirstLaunch();
  const trialEndsAt = new Date(firstLaunch.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const msRemaining = trialEndsAt.getTime() - Date.now();
  const trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  return { trialActive: msRemaining > 0, trialDaysRemaining };
}

/** Get the CdvPurchase store from the global window object (injected by the plugin). */
function getStore() {
  const w = window as unknown as { CdvPurchase?: { store: CdvPurchaseStore } };
  return w.CdvPurchase?.store ?? null;
}

interface CdvPurchaseStore {
  register: (products: object[]) => void;
  initialize: (platforms?: string[]) => Promise<void>;
  get: (id: string) => { owned: boolean; getOffer: () => object | undefined } | undefined;
  order: (offer: object) => Promise<{ isError: boolean; message?: string }>;
  restorePurchases: () => Promise<void>;
  when: () => {
    approved: (cb: (t: { verify: () => void }) => void) => { finished: (cb: (t: { finish: () => void }) => void) => void };
  };
  error: (cb: (e: object) => void) => void;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [hasPurchased, setHasPurchased] = useState(
    () => localStorage.getItem(PURCHASED_KEY) === "true"
  );
  const [isLoading, setIsLoading] = useState(Capacitor.isNativePlatform());

  const { trialActive, trialDaysRemaining } = useMemo(() => computeTrial(), []);
  const hasAccess = hasPurchased || trialActive;

  // Initialise StoreKit on mount and check for existing purchase
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      // Wait for the Cordova deviceready event which fires after plugins load
      await new Promise<void>(resolve => {
        if ((document as unknown as { readyState: string }).readyState === "complete") {
          resolve();
        } else {
          document.addEventListener("deviceready", () => resolve(), { once: true });
        }
      });

      const store = getStore();
      if (!store) {
        setIsLoading(false);
        return;
      }

      // Register the non-consumable product
      store.register([{
        id: PURCHASE_PRODUCT_ID,
        type: "non consumable",
        platform: "ios-appstore",
      }]);

      // Listen for approved transactions → verify → finish
      store.when()
        .approved(transaction => {
          transaction.verify();
        })
        .finished(transaction => {
          transaction.finish();
          const owned = store.get(PURCHASE_PRODUCT_ID)?.owned ?? false;
          if (owned) {
            localStorage.setItem(PURCHASED_KEY, "true");
            setHasPurchased(true);
          }
        });

      await store.initialize(["ios-appstore"]);

      // Check if already owned (handles reinstalls via Apple receipt)
      const owned = store.get(PURCHASE_PRODUCT_ID)?.owned ?? false;
      if (owned) {
        localStorage.setItem(PURCHASED_KEY, "true");
        setHasPurchased(true);
      }

      setIsLoading(false);
    };

    init().catch(() => setIsLoading(false));
  }, []);

  const purchase = useCallback(async () => {
    const store = getStore();
    if (!store) throw new Error("Store not available");

    const product = store.get(PURCHASE_PRODUCT_ID);
    if (!product) throw new Error("Product not found. Make sure it is set up in App Store Connect.");

    const offer = product.getOffer();
    if (!offer) throw new Error("No offer available for this product.");

    const result = await store.order(offer);
    if (result.isError) throw new Error(result.message ?? "Purchase failed");
  }, []);

  const restore = useCallback(async () => {
    const store = getStore();
    if (!store) throw new Error("Store not available");
    await store.restorePurchases();
    const owned = store.get(PURCHASE_PRODUCT_ID)?.owned ?? false;
    if (owned) {
      localStorage.setItem(PURCHASED_KEY, "true");
      setHasPurchased(true);
    }
  }, []);

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
