export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { isNative, getApiBaseUrl } from "./lib/platform";

// Returns the URL that initiates Google OAuth sign-in.
// On web: relative path (same origin as the backend).
// On native: absolute path to the hosted backend.
export const getLoginUrl = () => {
  const base = isNative ? getApiBaseUrl() : "";
  return `${base}/api/oauth/google`;
};
