import { z } from "@hono/zod-openapi";

export const FriendRequestSchema = z
  .object({
    id: z.number(),
    fromUserId: z.number(),
    fromUserName: z.string(),
    fromUserEmail: z.string(),
    status: z.string(),
    createdAt: z.string(),
  })
  .openapi("FriendRequest");

export type FriendRequest = z.infer<typeof FriendRequestSchema>;
