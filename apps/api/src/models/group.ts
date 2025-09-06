import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { group } from "@/db";

// ==========================================================
// GROUP SCHEMAS
// ==========================================================

export const GroupResponseSchema = createSelectSchema(group)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique group identifier",
    }),
    name: z.string().openapi({
      example: "Trip to Paris",
      description: "Group name",
    }),
    coverPhotoURL: z.string().nullable().openapi({
      example: "https://example.com/photo.jpg",
      description: "Group cover photo URL",
    }),
    createdBy: z.number().openapi({
      example: 123,
      description: "User ID who created the group",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the group was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the group was updated",
    }),
  })
  .openapi("GroupResponse");

export const GroupCreateSchema = createInsertSchema(group, {
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .openapi({
      example: "Weekend Getaway",
      description: "Group name",
    }),
  coverPhotoURL: z.string().optional().openapi({
    example: "https://example.com/photo.jpg",
    description: "Group cover photo URL",
  }),
  createdBy: z.number().openapi({
    example: 123,
    description: "User ID who created the group",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("GroupCreate");

export const GroupUpdateSchema =
  GroupCreateSchema.partial().openapi("GroupUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type GroupResponse = z.infer<typeof GroupResponseSchema>;
export type GroupCreate = z.infer<typeof GroupCreateSchema>;
export type GroupUpdate = z.infer<typeof GroupUpdateSchema>;
