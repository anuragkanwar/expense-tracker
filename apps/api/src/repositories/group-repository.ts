import { group } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import { GroupResponse, GroupCreate, GroupUpdate } from "@/models/group";
import { db as DATABASE } from "@pocket-pixie/db";

export class GroupRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<GroupResponse[]> {
    const result = await this.db
      .select()
      .from(group)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as GroupResponse[];
  }

  async findById(id: number): Promise<GroupResponse | null> {
    const result = await this.db
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
    } as GroupResponse;
  }

  async create(data: GroupCreate): Promise<GroupResponse> {
    const result = await this.db
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

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create group");
    }

    return created;
  }

  async update(id: number, data: GroupUpdate): Promise<GroupResponse | null> {
    await this.db.update(group).set(data).where(eq(group.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(group).where(eq(group.id, id));

    return result.rowsAffected > 0;
  }
}
