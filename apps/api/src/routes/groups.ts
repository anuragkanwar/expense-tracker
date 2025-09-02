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
  // TODO: Implement create group
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(getGroupsRoute, async (c) => {
  // TODO: Implement get user's groups
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(getGroupRoute, async (c) => {
  // TODO: Implement get group details
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(updateGroupRoute, async (c) => {
  // TODO: Implement update group
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(deleteGroupRoute, async (c) => {
  // TODO: Implement delete group
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(getGroupMembersRoute, async (c) => {
  // TODO: Implement get group members
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(addGroupMemberRoute, async (c) => {
  // TODO: Implement add group member
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(removeGroupMemberRoute, async (c) => {
  // TODO: Implement remove group member
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(getGroupBalancesRoute, async (c) => {
  // TODO: Implement get group balances
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(getSettlementPlanRoute, async (c) => {
  // TODO: Implement get settlement plan
  return c.json({ message: "Not implemented" }, 501);
});

groupRoutes.openapi(createSettlementRoute, async (c) => {
  // TODO: Implement create settlement
  return c.json({ message: "Not implemented" }, 501);
});
