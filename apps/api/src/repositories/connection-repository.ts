import { friendship } from "@/db";
import { eq } from "drizzle-orm";
import type {
  FriendshipResponse,
  FriendshipCreate,
  FriendshipUpdate,
} from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";
import { FRIEND_STATUS } from "@/db";

export class ConnectionRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<FriendshipResponse[]> {
    const db = tx ?? this.db;
    const result = await db
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

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<FriendshipResponse | null> {
    const db = tx ?? this.db;
    const result = await db
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

  async create(
    data: FriendshipCreate,
    tx?: DBTransactionType
  ): Promise<FriendshipResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(friendship)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
        status: data.status || FRIEND_STATUS.PENDING,
      })
      .returning({ id: friendship.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create connection");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create connection");
    }

    return created;
  }

  async update(
    id: number,
    data: FriendshipUpdate,
    tx?: DBTransactionType
  ): Promise<FriendshipResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(friendship)
      .set({
        ...data,
        status: data.status,
      })
      .where(eq(friendship.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(friendship).where(eq(friendship.id, id));

    return result.rowsAffected > 0;
  }
}
