import axios from "axios";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRedirectUri(req: Request): string {
  if (ENV.appUrl !== "http://localhost:3000") {
    return `${ENV.appUrl}/api/oauth/callback`;
  }
  const proto = (req.get("x-forwarded-proto") as string) || req.protocol;
  return `${proto}://${req.get("host")}/api/oauth/callback`;
}

export function registerOAuthRoutes(app: Express) {
  // Step 1: Redirect user to Google sign-in
  app.get("/api/oauth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
      return;
    }

    const redirectUri = getRedirectUri(req);
    const platform = getQueryParam(req, "platform") ?? "web";
    const state = Buffer.from(JSON.stringify({ redirectUri, platform })).toString("base64");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");

    res.redirect(url.toString());
  });

  // Step 2: Google redirects back here with an authorization code
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      const redirectUri: string = stateData.redirectUri ?? Buffer.from(state, "base64").toString("utf-8");
      const platform: string = stateData.platform ?? "web";

      // Exchange authorization code for access token
      const tokenRes = await axios.post<{ access_token: string }>(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }
      );

      // Fetch user profile from Google
      const userRes = await axios.get<{
        sub: string;
        name: string;
        email: string;
      }>("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });

      const { sub, name, email } = userRes.data;
      if (!sub) {
        res.status(400).json({ error: "No user ID returned from Google" });
        return;
      }

      await db.upsertUser({
        openId: sub,
        name: name || null,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(sub, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Native app: redirect via deep link; web: redirect to root
      res.redirect(
        302,
        platform === "native" ? "quintave://oauth/callback?success=true" : "/"
      );
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
