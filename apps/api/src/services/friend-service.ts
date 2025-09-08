import { FriendRepository } from "@/repositories/friend-repository";
import { UserResponse } from "@/models/user";
import { FRIEND_STATUS } from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { UserAuth } from "@/models/auth";
import { type DBTransactionType } from "@/db";

export class FriendService {
  private readonly friendRepository;

  constructor({ friendRepository }: { friendRepository: FriendRepository }) {
    this.friendRepository = friendRepository;
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    return this.friendRepository.areFriends(userId1, userId2);
  }

  async getFriends(user: UserAuth): Promise<UserResponse[]> {
    const userId = user.id;
    return this.friendRepository.findFriendsByUserId(userId);
  }

  async sendFriendRequest(
    user: UserAuth,
    friendId: number,
    tx?: DBTransactionType
  ) {
    const userId = user.id;

    if (userId === friendId) {
      throw new ValidationError("Cannot send friend request to yourself");
    }

    // Check if friendship already exists
    const existingFriendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        userId,
        friendId,
        tx
      );
    if (existingFriendship) {
      if (existingFriendship.status === FRIEND_STATUS.ACCEPTED) {
        throw new ValidationError("You are already friends");
      } else if (existingFriendship.status === FRIEND_STATUS.PENDING) {
        throw new ValidationError("Friend request already exists");
      } else if (existingFriendship.status === FRIEND_STATUS.BLOCKED) {
        // Check if current user is the blocker or the blocked
        if (existingFriendship.userId1 === userId) {
          throw new ValidationError("You have blocked this user");
        } else {
          throw new ValidationError(
            "You cannot send friend requests to blocked users"
          );
        }
      }
    }

    // Create new friend request
    return this.friendRepository.create(
      {
        userId1: userId,
        userId2: friendId,
        status: FRIEND_STATUS.PENDING,
      },
      tx
    );
  }

  async getFriendRequests(user: UserAuth) {
    const userId = user.id;
    return this.friendRepository.findPendingRequestsByUserId(userId);
  }

  async respondToFriendRequest(
    user: UserAuth,
    fromUserId: number,
    action: "accept" | "reject",
    tx?: DBTransactionType
  ) {
    const userId = user.id;

    // Find the friend request
    const friendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        fromUserId,
        userId,
        tx
      );
    if (!friendship) {
      throw new NotFoundError("Friend request not found");
    }

    if (friendship.status !== FRIEND_STATUS.PENDING) {
      if (friendship.status === FRIEND_STATUS.BLOCKED) {
        throw new ValidationError("Cannot respond to blocked user requests");
      }
      throw new ValidationError("Friend request is not pending");
    }

    // Make sure the current user is the recipient
    if (friendship.userId2 !== userId) {
      throw new ValidationError(
        "You are not authorized to respond to this friend request"
      );
    }

    if (action === "reject") {
      // Delete the friend request
      await this.friendRepository.delete(friendship.id, tx);
      return { message: "Friend request rejected" };
    } else {
      // Accept the friend request
      const updated = await this.friendRepository.update(
        friendship.id,
        {
          status: FRIEND_STATUS.ACCEPTED,
        },
        tx
      );
      return { message: "Friend request accepted", friendship: updated };
    }
  }

  async removeFriend(user: UserAuth, friendId: number, tx?: DBTransactionType) {
    const userId = user.id;

    // Find the friendship
    const friendship =
      await this.friendRepository.findAcceptedFriendshipBetweenUsers(
        userId,
        friendId,
        tx
      );
    if (!friendship) {
      // Check if there's a pending request to cancel
      const pendingRequest =
        await this.friendRepository.findFriendRequestBetweenUsers(
          userId,
          friendId,
          tx
        );
      if (pendingRequest && pendingRequest.status === FRIEND_STATUS.PENDING) {
        // Only allow cancellation if current user sent the request (is userId1)
        // or if current user received the request (is userId2)
        const canCancel =
          pendingRequest.userId1 === userId ||
          pendingRequest.userId2 === userId;
        if (canCancel) {
          await this.friendRepository.delete(pendingRequest.id, tx);
          const action =
            pendingRequest.userId1 === userId ? "cancelled" : "rejected";
          return { message: `Friend request ${action}` };
        }
      }
      throw new NotFoundError("Friendship not found");
    }

    // Delete the friendship
    await this.friendRepository.delete(friendship.id, tx);
    return { message: "Friend removed successfully" };
  }

  async blockUser(
    user: UserAuth,
    targetUserId: number,
    tx?: DBTransactionType
  ) {
    const userId = user.id;

    if (userId === targetUserId) {
      throw new ValidationError("Cannot block yourself");
    }

    // Check if there's an existing friendship
    const existingFriendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        userId,
        targetUserId,
        tx
      );

    if (existingFriendship) {
      if (existingFriendship.status === FRIEND_STATUS.BLOCKED) {
        throw new ValidationError("User is already blocked");
      }

      // Update existing friendship to blocked status
      await this.friendRepository.update(
        existingFriendship.id,
        { status: FRIEND_STATUS.BLOCKED },
        tx
      );
    } else {
      // Create new blocked relationship
      await this.friendRepository.create(
        {
          userId1: userId,
          userId2: targetUserId,
          status: FRIEND_STATUS.BLOCKED,
        },
        tx
      );
    }

    return { message: "User blocked successfully" };
  }

  async unblockUser(
    user: UserAuth,
    targetUserId: number,
    tx?: DBTransactionType
  ) {
    const userId = user.id;

    // Find the blocked relationship
    const blockedFriendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        userId,
        targetUserId,
        tx
      );

    if (
      !blockedFriendship ||
      blockedFriendship.status !== FRIEND_STATUS.BLOCKED
    ) {
      throw new NotFoundError("Blocked relationship not found");
    }

    // Check if the current user is the one who blocked
    if (blockedFriendship.userId1 !== userId) {
      throw new ValidationError("You can only unblock users you have blocked");
    }

    // Delete the blocked relationship
    await this.friendRepository.delete(blockedFriendship.id, tx);

    return { message: "User unblocked successfully" };
  }
}
