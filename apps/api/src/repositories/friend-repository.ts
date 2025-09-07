import { friendship, user } from "@/db";
import { eq, or, and, ne } from "drizzle-orm";
import {
  FriendshipResponse,
  FriendshipCreate,
  FriendshipUpdate,
} from "@/models/friendship";
import { UserResponse } from "@/models/user";
import { db as DATABASE } from "@/db";
import { FRIEND_STATUS } from "@/db";

export class FriendRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<FriendshipResponse[]> {
    const result = await this.db
      .select()
      .from(friendship)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as FriendshipResponse[];
  }

  async findById(id: number): Promise<FriendshipResponse | null> {
    const result = await this.db
      .select()
      .from(friendship)
      .where(eq(friendship.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as FriendshipResponse;
  }

  async create(data: FriendshipCreate): Promise<FriendshipResponse> {
    const result = await this.db
      .insert(friendship)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
        status: data.status || FRIEND_STATUS.PENDING,
      })
      .returning({ id: friendship.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create friend");
    }

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create friend");
    }

    return created;
  }

  async update(
    id: number,
    data: FriendshipUpdate
  ): Promise<FriendshipResponse | null> {
    await this.db
      .update(friendship)
      .set({
        ...data,
        status: data.status,
      })
      .where(eq(friendship.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(friendship)
      .where(eq(friendship.id, id));

    return result.rowsAffected > 0;
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(friendship)
      .where(
        and(
          or(
            and(
              eq(friendship.userId1, userId1),
              eq(friendship.userId2, userId2)
            ),
            and(
              eq(friendship.userId1, userId2),
              eq(friendship.userId2, userId1)
            )
          ),
          eq(friendship.status, FRIEND_STATUS.ACCEPTED)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async findFriendsByUserId(userId: number): Promise<UserResponse[]> {
    const result = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        currency: user.currency,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(friendship)
      .innerJoin(
        user,
        or(
          and(eq(friendship.userId1, userId), eq(friendship.userId2, user.id)),
          and(eq(friendship.userId2, userId), eq(friendship.userId1, user.id))
        )
      )
      .where(
        and(
          eq(friendship.status, FRIEND_STATUS.ACCEPTED),
          ne(user.id, userId) // Exclude the user themselves
        )
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserResponse[];
  }

  async findPendingRequestsByUserId(userId: number): Promise<
    Array<{
      id: number;
      fromUserId: number;
      fromUserName: string;
      fromUserEmail: string;
      status: string;
      createdAt: string;
    }>
  > {
    const result = await this.db
      .select({
        id: friendship.id,
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserEmail: user.email,
        status: friendship.status,
        createdAt: friendship.createdAt,
      })
      .from(friendship)
      .innerJoin(user, eq(friendship.userId1, user.id))
      .where(
        and(
          eq(friendship.userId2, userId),
          eq(friendship.status, FRIEND_STATUS.PENDING)
        )
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async findFriendRequestBetweenUsers(
    userId1: number,
    userId2: number
  ): Promise<FriendshipResponse | null> {
    const result = await this.db
      .select()
      .from(friendship)
      .where(
        or(
          and(eq(friendship.userId1, userId1), eq(friendship.userId2, userId2)),
          and(eq(friendship.userId1, userId2), eq(friendship.userId2, userId1))
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as FriendshipResponse;
  }

  async findAcceptedFriendshipBetweenUsers(
    userId1: number,
    userId2: number
  ): Promise<FriendshipResponse | null> {
    const result = await this.db
      .select()
      .from(friendship)
      .where(
        and(
          or(
            and(
              eq(friendship.userId1, userId1),
              eq(friendship.userId2, userId2)
            ),
            and(
              eq(friendship.userId1, userId2),
              eq(friendship.userId2, userId1)
            )
          ),
          eq(friendship.status, FRIEND_STATUS.ACCEPTED)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as FriendshipResponse;
  }
}
