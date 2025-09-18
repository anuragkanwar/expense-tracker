import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createGroupRoute,
  getGroupsRoute,
  getGroupRoute,
  updateGroupRoute,
  deleteGroupRoute,
  getGroupMembersRoute,
  addGroupMemberRoute,
  removeGroupMemberRoute,
  getGroupBalancesRoute,
  getSettlementPlanRoute,
  getGroupLoansRoute,
} from "./groups.contracts";

export const groupRoutes = new OpenAPIHono();

groupRoutes.openapi(createGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  const group = await services.groupService.createGroup({
    ...body,
    createdBy: user.id,
  });

  return c.json(group, 201);
});

groupRoutes.openapi(getGroupsRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const groups = await services.groupService.getGroupsByUser(user.id);

  return c.json(groups, 200);
});

groupRoutes.openapi(getGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  const group = await services.groupService.getGroupByIdAndUser(
    user.id,
    groupId
  );
  return c.json(group, 200);
});

groupRoutes.openapi(updateGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");
  const body = c.req.valid("json");

  const updatedGroup = await services.groupService.updateGroupByUser(
    user.id,
    groupId,
    body
  );
  if (!updatedGroup) {
    return c.json({ message: "Group not found" }, 404);
  }
  return c.json(updatedGroup, 200);
});

groupRoutes.openapi(deleteGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  await services.groupService.deleteGroupByUser(user.id, groupId);
  return c.json({ message: "Group deleted successfully" }, 200);
});

groupRoutes.openapi(getGroupMembersRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  const members = await services.groupService.getGroupMembersByUser(
    user.id,
    groupId
  );
  return c.json(members, 200);
});

groupRoutes.openapi(addGroupMemberRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");
  const body = c.req.valid("json");

  try {
    // Check if it's a bulk operation or single operation
    if ("userIds" in body && Array.isArray(body.userIds)) {
      // Bulk operation
      const result = await services.groupService.addGroupMembersBulk(
        user.id,
        groupId,
        body.userIds as number[]
      );
      return c.json(result, 201);
    } else if ("userId" in body && typeof body.userId === "number") {
      // Single operation
      await services.groupService.addGroupMemberByUser(
        user.id,
        groupId,
        body.userId
      );
      return c.json({ message: "Member added successfully" }, 201);
    } else {
      return c.json({ message: "Invalid request body" }, 400);
    }
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

groupRoutes.openapi(removeGroupMemberRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId, userId } = c.req.valid("param");

  try {
    await services.groupService.removeGroupMemberByUser(
      user.id,
      groupId,
      userId
    );
    return c.json({ message: "Member removed successfully" }, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

groupRoutes.openapi(getGroupBalancesRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  try {
    const balances = await services.groupService.getGroupBalancesByUser(
      user.id,
      groupId
    );
    return c.json(balances, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

groupRoutes.openapi(getSettlementPlanRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  try {
    const settlementPlan = await services.groupService.getSettlementPlanByUser(
      user.id,
      groupId
    );
    return c.json(settlementPlan, 200);
  } catch (error: unknown) {
    const { handleRouteError } = await import("@/utils/error-response-handler");
    const { json, status } = handleRouteError(error);
    return c.json(json, status);
  }
});

// [REMOVED] Group direct settlement handler: Legacy group direct settlement endpoint removed as part of migration to allocation-based settlement.

// Group loan routes
groupRoutes.openapi(getGroupLoansRoute, async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ message: "Unauthorized" }, 401);
    const { groupId } = c.req.valid("param");
    const query = c.req.valid("query");
    const { loanService } = c.get("services");
    const { page, limit } = query;

    const result = await loanService.getGroupLoans(groupId, user.id, {
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
