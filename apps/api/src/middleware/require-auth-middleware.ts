import { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "@/errors/base-error";

export const requireAuthMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    return next();
  };
};
