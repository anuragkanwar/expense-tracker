import type { MiddlewareHandler } from "hono";
import { container } from "../container";
import type { IStudentService } from "../services";

/**
 * Middleware to inject dependencies into Hono context
 * This makes services available to all route handlers
 */
export const diMiddleware: MiddlewareHandler = async (c, next) => {
  // Resolve services from container and inject into context
  c.set("studentService", container.resolve<IStudentService>("studentService"));

  await next();
};
