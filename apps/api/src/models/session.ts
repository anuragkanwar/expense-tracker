import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { session } from "@/db";

// ==========================================================
// SESSION SCHEMAS
// ==========================================================

export const SessionResponseSchema = createSelectSchema(session)
  .extend({
    // Add any extensions if needed
  })
  .openapi("SessionResponse");

// Assuming no create for session, as it's usually generated
export const SessionCreateSchema = createInsertSchema(session)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("SessionCreate");

export const SessionUpdateSchema =
  SessionCreateSchema.partial().openapi("SessionUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type SessionCreate = z.infer<typeof SessionCreateSchema>;
export type SessionUpdate = z.infer<typeof SessionUpdateSchema>;
