import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { FRIEND_STATUS, friendship } from "@pocket-pixie/db";

// ==========================================================
// FRIENDSHIP SCHEMAS
// ==========================================================

export const FriendshipResponseSchema = createSelectSchema(friendship)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique friendship identifier",
    }),
    userId1: z.number().openapi({
      example: 123,
      description: "First user ID",
    }),
    userId2: z.number().openapi({
      example: 456,
      description: "Second user ID",
    }),
    status: z.enum(FRIEND_STATUS).openapi({
      example: "accepted",
      description: "Friendship status",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the friendship was created",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the friendship was updated",
    }),
  })
  .openapi("FriendshipResponse");

export const FriendshipCreateSchema = createInsertSchema(friendship, {
  userId1: z.number().openapi({
    example: 123,
    description: "First user ID",
  }),
  userId2: z.number().openapi({
    example: 456,
    description: "Second user ID",
  }),
  status: z.enum(FRIEND_STATUS).optional().openapi({
    example: "pending",
    description: "Friendship status",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("FriendshipCreate");

export const FriendshipUpdateSchema =
  FriendshipCreateSchema.partial().openapi("FriendshipUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type FriendshipResponse = z.infer<typeof FriendshipResponseSchema>;
export type FriendshipCreate = z.infer<typeof FriendshipCreateSchema>;
export type FriendshipUpdate = z.infer<typeof FriendshipUpdateSchema>;
