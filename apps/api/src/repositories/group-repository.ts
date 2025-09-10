import { group } from "@/db";
import { eq } from "drizzle-orm";
import { GroupResponse, GroupCreate, GroupUpdate } from "@/models/group";
import { type DBType, type DBTransactionType } from "@/db";

export class GroupRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<GroupResponse[]> {
    const db = tx ?? this.db;
    const result = await db.select().from(group).limit(limit).offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<GroupResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(group)
      .where(eq(group.id, id))
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
    };
  }

  async create(
    data: GroupCreate,
    tx?: DBTransactionType
  ): Promise<GroupResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(group)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning({ id: group.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create group");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create group");
    }

    return created;
  }

  async update(
    id: number,
    data: GroupUpdate,
    tx?: DBTransactionType
  ): Promise<GroupResponse | null> {
    const db = tx ?? this.db;
    await db.update(group).set(data).where(eq(group.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(group).where(eq(group.id, id));

    return result.rowsAffected > 0;
  }
}
