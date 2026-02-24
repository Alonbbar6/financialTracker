export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { isNative, getApiBaseUrl } from "./lib/platform";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId) {
    return "/";
  }

  // On native, the OAuth redirect must go to the hosted backend URL
  // so the server can set the cookie, then redirect back via deep link.
  const redirectUri = isNative
    ? `${getApiBaseUrl()}/api/oauth/callback`
    : `${window.location.origin}/api/oauth/callback`;

  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  if (isNative) {
    url.searchParams.set("platform", "native");
  }

  return url.toString();
};
