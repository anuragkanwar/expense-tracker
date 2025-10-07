import { describe, it, expect, vi, beforeEach } from "vitest";
import { GroupService } from "./group-service";
import { GroupRepository } from "../repositories/group-repository";
import { GroupMemberService } from "./group-member-service";
import { FriendService } from "./friend-service";

// Mock the repositories and services
const mockGroupRepository = {
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findAll: vi.fn(),
};

const mockGroupMemberService = {
  addGroupMember: vi.fn(),
  getGroupMembers: vi.fn(),
  removeGroupMember: vi.fn(),
};

const mockFriendService = {
  areFriends: vi.fn(),
};

const mockExpenseService = {};
const mockDb = {};

const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  currency: "USD",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("GroupService", () => {
  let groupService: GroupService;

  beforeEach(() => {
    vi.clearAllMocks();
    groupService = new GroupService({
      groupRepository: mockGroupRepository as any,
      groupMemberService: mockGroupMemberService as any,
      loanService: mockExpenseService as any,
      friendService: mockFriendService as any,
      db: mockDb as any,
    });
  });

  describe("addGroupMembersBulk", () => {
    beforeEach(() => {
      // Mock successful group ownership check
      mockGroupRepository.findById.mockResolvedValue({
        id: 1,
        name: "Test Group",
        createdBy: 1,
      });
    });

    it("should successfully add multiple friends to group", async () => {
      const memberIds = [2, 3, 4];

      // Mock all users are friends
      mockFriendService.areFriends.mockResolvedValue(true);

      // Mock no existing members
      mockGroupMemberService.getGroupMembers.mockResolvedValue([]);

      // Mock successful member addition
      mockGroupMemberService.addGroupMember.mockResolvedValue({});

      const result = await groupService.addGroupMembersBulk(1, 1, memberIds);

      expect(result.added).toEqual([2, 3, 4]);
      expect(result.failed).toEqual([]);
      expect(mockGroupMemberService.addGroupMember).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed success and failure scenarios", async () => {
      const memberIds = [2, 3, 4];

      // Mock user 2 is a friend, user 3 is not a friend, user 4 is already a member
      mockFriendService.areFriends
        .mockResolvedValueOnce(true) // user 2
        .mockResolvedValueOnce(false) // user 3
        .mockResolvedValueOnce(true); // user 4

      // Mock user 4 is already a member
      mockGroupMemberService.getGroupMembers.mockResolvedValue([
        { userId: 4, groupId: 1 },
      ]);

      // Mock successful addition for user 2
      mockGroupMemberService.addGroupMember.mockResolvedValue({});

      const result = await groupService.addGroupMembersBulk(1, 1, memberIds);

      expect(result.added).toEqual([2]);
      expect(result.failed).toEqual([
        { userId: 3, reason: "You can only add friends to groups" },
        { userId: 4, reason: "User is already a member of this group" },
      ]);
    });

    it("should handle empty member list", async () => {
      const result = await groupService.addGroupMembersBulk(1, 1, []);

      expect(result.added).toEqual([]);
      expect(result.failed).toEqual([]);
    });

    it("should reject non-owner access", async () => {
      // Mock group owned by different user
      mockGroupRepository.findById.mockResolvedValue({
        id: 1,
        name: "Test Group",
        createdBy: 2, // Different owner
      });

      await expect(groupService.addGroupMembersBulk(1, 1, [2])).rejects.toThrow(
        "Forbidden"
      );
    });

    it("should reject non-existent group", async () => {
      mockGroupRepository.findById.mockResolvedValue(null);

      await expect(
        groupService.addGroupMembersBulk(1, 999, [2])
      ).rejects.toThrow("Group not found");
    });
  });
});
