import { SessionAuth, UserAuth } from "@/models/auth";
import { auth } from "@/db";
import { MiddlewareHandler } from "hono";

declare module "hono" {
  interface ContextVariableMap {
    user: UserAuth | null;
    session: SessionAuth | null;
  }
}

export const authMiddeware = (): MiddlewareHandler => {
  return async (c, next) => {
    // Skip auth middleware for Better Auth routes
    if (c.req.path.startsWith("/api/v1/auth/")) {
      return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  };
};
