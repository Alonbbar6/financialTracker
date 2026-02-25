import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as db from "../db";
import { ENV } from "./env";

const ALLOWED_ORIGINS = [
  // Local dev
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  // Netlify frontend
  "https://financalapptracker.netlify.app",
  // Capacitor native WebView
  "capacitor://localhost",
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some(o =>
    typeof o === "string" ? o === origin : o.test(origin)
  );
}

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,trpc-accept,Authorization");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(corsMiddleware);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // RevenueCat webhook — called when a purchase is completed on device
  app.post(
    "/api/webhooks/revenuecat",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const secret = ENV.revenueCatWebhookSecret;
      if (!secret) {
        console.warn("[RevenueCat] Webhook secret not configured");
        res.status(500).json({ error: "Webhook not configured" });
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== secret) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      try {
        const body = JSON.parse(req.body.toString());
        const event = body.event;
        if (!event) { res.status(400).json({ error: "Missing event" }); return; }

        // For a one-time (non-consumable) purchase only INITIAL_PURCHASE matters
        if (event.type !== "INITIAL_PURCHASE") {
          res.status(200).json({ received: true });
          return;
        }

        const appUserId: string = event.app_user_id;
        const user = await db.getUserByRevenueCatId(appUserId);
        if (!user) {
          console.warn(`[RevenueCat] No user found for appUserId: ${appUserId}`);
          res.status(200).json({ received: true });
          return;
        }

        await db.markUserPurchased(user.id, appUserId);
        console.log(`[RevenueCat] User ${user.id} purchase confirmed`);
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("[RevenueCat] Webhook error:", error);
        res.status(500).json({ error: "Processing failed" });
      }
    }
  );

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`[ENV] GOOGLE_CLIENT_ID: ${ENV.googleClientId ? "set" : "MISSING"}`);
    console.log(`[ENV] DATABASE_URL: ${ENV.databaseUrl ? "set" : "MISSING"}`);
  });
}

startServer().catch(console.error);
