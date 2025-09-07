import { FriendRepository } from "@/repositories/friend-repository";
import { UserResponse } from "@/models/user";
import { FRIEND_STATUS } from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { UserAuth } from "@/models/auth";

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

  async sendFriendRequest(user: UserAuth, friendId: number) {
    const userId = user.id;

    if (userId === friendId) {
      throw new ValidationError("Cannot send friend request to yourself");
    }

    // Check if friendship already exists
    const existingFriendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        userId,
        friendId
      );
    if (existingFriendship) {
      if (existingFriendship.status === FRIEND_STATUS.ACCEPTED) {
        throw new ValidationError("You are already friends");
      } else if (existingFriendship.status === FRIEND_STATUS.PENDING) {
        throw new ValidationError("Friend request already exists");
      }
    }

    // Create new friend request
    return this.friendRepository.create({
      userId1: userId,
      userId2: friendId,
      status: FRIEND_STATUS.PENDING,
    });
  }

  async getFriendRequests(user: UserAuth) {
    const userId = user.id;
    return this.friendRepository.findPendingRequestsByUserId(userId);
  }

  async respondToFriendRequest(
    user: UserAuth,
    fromUserId: number,
    action: "accept" | "reject"
  ) {
    const userId = user.id;

    // Find the friend request
    const friendship =
      await this.friendRepository.findFriendRequestBetweenUsers(
        fromUserId,
        userId
      );
    if (!friendship) {
      throw new NotFoundError("Friend request not found");
    }

    if (friendship.status !== FRIEND_STATUS.PENDING) {
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
      await this.friendRepository.delete(friendship.id);
      return { message: "Friend request rejected" };
    } else {
      // Accept the friend request
      const updated = await this.friendRepository.update(friendship.id, {
        status: FRIEND_STATUS.ACCEPTED,
      });
      return { message: "Friend request accepted", friendship: updated };
    }
  }

  async removeFriend(user: UserAuth, friendId: number) {
    const userId = user.id;

    // Find the friendship
    const friendship =
      await this.friendRepository.findAcceptedFriendshipBetweenUsers(
        userId,
        friendId
      );
    if (!friendship) {
      // Check if there's a pending request to cancel
      const pendingRequest =
        await this.friendRepository.findFriendRequestBetweenUsers(
          userId,
          friendId
        );
      if (pendingRequest && pendingRequest.status === FRIEND_STATUS.PENDING) {
        await this.friendRepository.delete(pendingRequest.id);
        return { message: "Friend request cancelled" };
      }
      throw new NotFoundError("Friendship not found");
    }

    // Delete the friendship
    await this.friendRepository.delete(friendship.id);
    return { message: "Friend removed successfully" };
  }
}
