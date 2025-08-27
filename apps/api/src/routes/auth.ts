import { Hono } from "hono";
import { auth } from "@pocket-pixie/auth";

const app = new Hono();

/**
 * Authentication routes
 * Handles all auth-related endpoints using Better Auth
 */

// Handle all auth requests
app.on(["POST", "GET"], "/*", (c) => {
  return auth.handler(c.req.raw);
});

// Auth callback endpoint for mobile deep linking
app.get("/callback", (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code) {
    return c.json(
      {
        success: false,
        error: {
          code: "MISSING_CODE",
          message: "Authorization code is required",
        },
      },
      400
    );
  }

  // Redirect to mobile app with auth data
  const redirectUrl = `pocket-pixie://auth/callback?code=${code}&state=${state || ""}`;

  return c.redirect(redirectUrl);
});

export default app;
