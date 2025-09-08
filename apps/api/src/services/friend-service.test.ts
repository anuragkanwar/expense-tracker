import { describe, it, expect, vi, beforeEach } from "vitest";
import { FriendService } from "./friend-service";
import { FRIEND_STATUS } from "../db/constants";

// Mock the repository
const mockFriendRepository = {
  areFriends: vi.fn(),
  findFriendsByUserId: vi.fn(),
  sendFriendRequest: vi.fn(),
  findFriendRequestBetweenUsers: vi.fn(),
  findPendingRequestsByUserId: vi.fn(),
  respondToFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findAcceptedFriendshipBetweenUsers: vi.fn(),
};

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

describe("FriendService", () => {
  let friendService: FriendService;

  beforeEach(() => {
    vi.clearAllMocks();
    friendService = new FriendService({
      friendRepository: mockFriendRepository as any,
    });
  });

  describe("sendFriendRequest", () => {
    it("should prevent sending friend request to self", async () => {
      await expect(
        friendService.sendFriendRequest(mockUser, 1)
      ).rejects.toThrow("Cannot send friend request to yourself");
    });

    it("should prevent sending duplicate friend requests", async () => {
      mockFriendRepository.findFriendRequestBetweenUsers.mockResolvedValue({
        id: 1,
        userId1: 1,
        userId2: 2,
        status: FRIEND_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        friendService.sendFriendRequest(mockUser, 2)
      ).rejects.toThrow("Friend request already exists");
    });
  });
});
