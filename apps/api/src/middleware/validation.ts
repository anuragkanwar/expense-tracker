import { MiddlewareHandler } from "hono";
import { z } from "zod";
import { ValidationError } from "../errors/base-error";

export const validateBody = (schema: z.ZodSchema): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set("validatedBody", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Request validation failed", error.issues);
      }
      throw error;
    }
  };
};

export const validateQuery = (schema: z.ZodSchema): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const query = c.req.query();
      const validatedData = schema.parse(query);
      c.set("validatedQuery", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Query validation failed", error.issues);
      }
      throw error;
    }
  };
};

export const validateParams = (schema: z.ZodSchema): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const params = c.req.param();
      const validatedData = schema.parse(params);
      c.set("validatedParams", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Params validation failed", error.issues);
      }
      throw error;
    }
  };
};
