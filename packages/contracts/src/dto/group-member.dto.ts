import { z } from "@hono/zod-openapi";

export const GroupMemberSchema = z
  .object({
    userId: z.number(),
    name: z.string(),
    email: z.string(),
    joinedAt: z.string(),
  })
  .openapi("GroupMember");

export type GroupMember = z.infer<typeof GroupMemberSchema>;
