import { MiddlewareHandler } from "hono";

export const logger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const url = c.req.url;

    // Only log in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${new Date().toISOString()}] ${method} ${url} - Start`);
    }

    await next();

    const end = Date.now();
    const duration = end - start;
    const status = c.res.status;

    // Only log in non-production environments
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[${new Date().toISOString()}] ${method} ${url} - ${status} - ${duration}ms`
      );
    }
  };
};