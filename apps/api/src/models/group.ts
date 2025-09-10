import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { group } from "@/db";

// ==========================================================
// GROUP SCHEMAS
// ==========================================================

export const GroupResponseSchema = createSelectSchema(group)
  .transform((data) => ({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }))
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
