import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { verification } from "@pocket-pixie/db";

// ==========================================================
// VERIFICATION SCHEMAS
// ==========================================================

export const VerificationResponseSchema = createSelectSchema(verification)
  .extend({
    // Add any extensions if needed
  })
  .openapi("VerificationResponse");

export const VerificationCreateSchema = createInsertSchema(verification)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("VerificationCreate");

export const VerificationUpdateSchema =
  VerificationCreateSchema.partial().openapi("VerificationUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type VerificationResponse = z.infer<typeof VerificationResponseSchema>;
export type VerificationCreate = z.infer<typeof VerificationCreateSchema>;
export type VerificationUpdate = z.infer<typeof VerificationUpdateSchema>;
