import { userBalance } from "@/db";
import { eq } from "drizzle-orm";
import {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@/models/user-balance";
import { db as DATABASE } from "@/db";

export class BalanceRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<UserBalanceResponse[]> {
    const result = await this.db
      .select()
      .from(userBalance)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async findById(id: number): Promise<UserBalanceResponse | null> {
    const result = await this.db
      .select()
      .from(userBalance)
      .where(eq(userBalance.id, id))
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
    } as UserBalanceResponse;
  }

  async create(data: UserBalanceCreate): Promise<UserBalanceResponse> {
    const result = await this.db
      .insert(userBalance)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning({ id: userBalance.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create balance");
    }

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create balance");
    }

    return created;
  }

  async update(
    id: number,
    data: UserBalanceUpdate
  ): Promise<UserBalanceResponse | null> {
    await this.db.update(userBalance).set(data).where(eq(userBalance.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(userBalance)
      .where(eq(userBalance.id, id));

    return result.rowsAffected > 0;
  }
}
