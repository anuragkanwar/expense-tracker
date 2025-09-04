import { friendship } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import {
  FriendshipResponse,
  FriendshipCreate,
  FriendshipUpdate,
} from "@/models/friendship";
import { db as DATABASE } from "@pocket-pixie/db";

export class ConnectionRepository {
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

  async findById(id: string): Promise<FriendshipResponse | null> {
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
    const id = crypto.randomUUID();

    await this.db.insert(friendship).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
      status: data.status,
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create connection");
    }

    return created;
  }

  async update(
    id: string,
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

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(friendship)
      .where(eq(friendship.id, id));

    return result.rowsAffected > 0;
  }
}
