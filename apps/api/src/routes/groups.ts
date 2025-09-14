import { OpenAPIHono } from "@hono/zod-openapi";
import { requireAuthMiddleware } from "@/middleware/require-auth-middleware";
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
  createGroupDirectSettlementRoute,
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
  } catch (error: any) {
    if (error.message === "Group not found") {
      return c.json({ message: "Group not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    if (error.message.includes("already a member")) {
      return c.json({ message: "User is already a member of this group" }, 409);
    }
    return c.json({ message: "Failed to add member" }, 400);
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
  } catch (error: any) {
    if (error.message === "Group not found") {
      return c.json({ message: "Group not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: "Failed to remove member" }, 400);
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
  } catch (error: any) {
    if (error.message === "Group not found") {
      return c.json({ message: "Group not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: "Failed to calculate balances" }, 400);
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
  } catch (error: any) {
    if (error.message === "Group not found") {
      return c.json({ message: "Group not found" }, 404);
    }
    if (error.message === "Forbidden") {
      return c.json({ message: "Forbidden" }, 403);
    }
    return c.json({ message: "Failed to calculate settlement plan" }, 400);
  }
});

groupRoutes.openapi(createGroupDirectSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (!idempotencyKey) {
      return c.json({ message: "Idempotency-Key header required" }, 400);
    }
    const settlement = await services.settlementService.createDirectSettlement({
      payerId: user.id,
      payeeId: body.payeeId,
      amount: body.amount,
      currency: body.currency,
      groupId: body.groupId ?? null,
      idempotencyKey,
    });
    return c.json(settlement, 201);
  } catch (error: any) {
    return c.json({ message: "Failed to record settlement" }, 400);
  }
});
