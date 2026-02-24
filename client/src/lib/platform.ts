import { Capacitor } from "@capacitor/core";

/**
 * True when running inside a Capacitor native WebView (iOS or Android).
 * False on web (browser) builds.
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * The base URL for API calls.
 * - Native: must be an absolute URL because there is no local server in the WebView.
 * - Web: empty string so relative paths (/api/trpc) work against the page origin.
 *
 * Set VITE_API_BASE_URL in your .env file when building for native.
 * Example: VITE_API_BASE_URL=https://api.quintave.app
 */
export function getApiBaseUrl(): string {
  if (isNative) {
    const nativeUrl = import.meta.env.VITE_API_BASE_URL;
    if (!nativeUrl) {
      throw new Error(
        "VITE_API_BASE_URL must be set for native builds. " +
          "Add it to your .env file: VITE_API_BASE_URL=https://your-api.com"
      );
    }
    return nativeUrl;
  }
  return "";
}

/** Full tRPC endpoint URL, platform-aware. */
export const getTrpcUrl = () => `${getApiBaseUrl()}/api/trpc`;
