import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { groupMember } from "@pocket-pixie/db";

// ==========================================================
// GROUP MEMBER SCHEMAS
// ==========================================================

export const GroupMemberResponseSchema = createSelectSchema(groupMember)
  .extend({
    id: z.number().openapi({
      example: 123,
      description: "Unique member identifier",
    }),
    groupId: z.number().openapi({
      example: 123,
      description: "Group ID",
    }),
    userId: z.number().openapi({
      example: 123,
      description: "User ID",
    }),
    createdAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the member was added",
    }),
    updatedAt: z.string().openapi({
      example: "2025-09-01T12:00:00.000Z",
      description: "When the member was updated",
    }),
  })
  .openapi("GroupMemberResponse");

export const GroupMemberCreateSchema = createInsertSchema(groupMember, {
  groupId: z.number().openapi({
    example: 123,
    description: "Group ID",
  }),
  userId: z.number().openapi({
    example: 123,
    description: "User ID",
  }),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("GroupMemberCreate");

export const GroupMemberUpdateSchema =
  GroupMemberCreateSchema.partial().openapi("GroupMemberUpdate");

// ==========================================
// TYPE EXPORTS
// ==========================================
export type GroupMemberResponse = z.infer<typeof GroupMemberResponseSchema>;
export type GroupMemberCreate = z.infer<typeof GroupMemberCreateSchema>;
export type GroupMemberUpdate = z.infer<typeof GroupMemberUpdateSchema>;
