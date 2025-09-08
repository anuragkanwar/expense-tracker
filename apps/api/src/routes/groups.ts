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
  createSettlementRoute,
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
  const groups = await services.groupService.getAllGroups();

  // Filter groups by user (groups created by user)
  const userGroups = groups.filter((group) => group.createdBy === user.id);

  return c.json(userGroups, 200);
});

groupRoutes.openapi(getGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  return c.json(existingGroup, 200);
});

groupRoutes.openapi(deleteGroupRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const deleted = await services.groupService.deleteGroup(groupId);

  if (!deleted) {
    return c.json({ message: "Group not found" }, 404);
  }

  return c.json({ message: "Group deleted successfully" }, 200);
});

groupRoutes.openapi(getGroupMembersRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const { groupId } = c.req.valid("param");

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  const members = await services.groupService.getGroupMembers(groupId);
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

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  try {
    await services.groupService.addGroupMember(groupId, body.userId);
    return c.json({ message: "Member added successfully" }, 201);
  } catch (error: any) {
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

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  try {
    await services.groupService.removeGroupMember(groupId, userId);
    return c.json({ message: "Member removed successfully" }, 200);
  } catch (error: any) {
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

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  try {
    const balances = await services.groupService.getGroupBalances(groupId);
    return c.json(balances, 200);
  } catch (error: any) {
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

  // First check if group exists and belongs to user
  const existingGroup = await services.groupService.getGroupById(groupId);
  if (!existingGroup) {
    return c.json({ message: "Group not found" }, 404);
  }

  if (existingGroup.createdBy !== user.id) {
    return c.json({ message: "Forbidden" }, 403);
  }

  try {
    const settlementPlan =
      await services.groupService.getSettlementPlan(groupId);
    return c.json(settlementPlan, 200);
  } catch (error: any) {
    return c.json({ message: "Failed to calculate settlement plan" }, 400);
  }
});

groupRoutes.openapi(createSettlementRoute, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const services = c.get("services");
  const body = c.req.valid("json");

  try {
    await services.settlementService.createSettlement({
      ...body,
      payerId: user.id,
    });
    return c.json({ message: "Settlement recorded successfully" }, 201);
  } catch (error: any) {
    return c.json({ message: "Failed to record settlement" }, 400);
  }
});
