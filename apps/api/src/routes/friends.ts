import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getFriendsRoute,
  sendFriendRequestRoute,
  getFriendRequestsRoute,
  respondToFriendRequestRoute,
  removeFriendRoute,
  getFriendLoansRoute,
} from "./friends.contracts";

export const friendRoutes = new OpenAPIHono();

friendRoutes.openapi(getFriendsRoute, async (c) => {
  try {
    const { friendService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const friends = await friendService.getFriends(user);
    return c.json(friends, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

friendRoutes.openapi(sendFriendRequestRoute, async (c) => {
  try {
    const { friendId } = c.req.valid("json");
    const { friendService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const friendship = await friendService.sendFriendRequest(user, friendId);
    return c.json(friendship, 201);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

friendRoutes.openapi(getFriendRequestsRoute, async (c) => {
  try {
    const { friendService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const requests = await friendService.getFriendRequests(user);
    return c.json(requests, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

friendRoutes.openapi(respondToFriendRequestRoute, async (c) => {
  try {
    const { userId } = c.req.valid("param");
    const { action } = c.req.valid("json");
    const { friendService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const result = await friendService.respondToFriendRequest(
      user,
      userId,
      action
    );
    return c.json(result, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

friendRoutes.openapi(removeFriendRoute, async (c) => {
  try {
    const { userId } = c.req.valid("param");
    const { friendService } = c.get("services");
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "Not authenticated" }, 401);
    }
    const result = await friendService.removeFriend(user, userId);
    return c.json(result, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

// Friend loan routes
friendRoutes.openapi(getFriendLoansRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const { friendId } = c.req.valid("param");
    const query = c.req.valid("query");
    const { loanService } = c.get("services");
    const { page, limit } = query;

    const result = await loanService.getFriendLoans(friendId, user.id, {
      page,
      limit,
    });

    return c.json(result, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});
