import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getFriendsRoute,
  sendFriendRequestRoute,
  getFriendRequestsRoute,
  respondToFriendRequestRoute,
  removeFriendRoute,
} from "./friends.contracts";

export const friendRoutes = new OpenAPIHono();

friendRoutes.openapi(getFriendsRoute, async (c) => {
  // TODO: Implement get friends list
  return c.json({ message: "Not implemented" }, 501);
});

friendRoutes.openapi(sendFriendRequestRoute, async (c) => {
  // TODO: Implement send friend request
  return c.json({ message: "Not implemented" }, 501);
});

friendRoutes.openapi(getFriendRequestsRoute, async (c) => {
  // TODO: Implement get friend requests
  return c.json({ message: "Not implemented" }, 501);
});

friendRoutes.openapi(respondToFriendRequestRoute, async (c) => {
  // TODO: Implement respond to friend request
  return c.json({ message: "Not implemented" }, 501);
});

friendRoutes.openapi(removeFriendRoute, async (c) => {
  // TODO: Implement remove friend
  return c.json({ message: "Not implemented" }, 501);
});
