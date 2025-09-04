import { userBalance } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@/models/user-balance";
import { db as DATABASE } from "@pocket-pixie/db";

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

  async findById(id: string): Promise<UserBalanceResponse | null> {
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
    const id = crypto.randomUUID();

    await this.db.insert(userBalance).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create balance");
    }

    return created;
  }

  async update(
    id: string,
    data: UserBalanceUpdate
  ): Promise<UserBalanceResponse | null> {
    await this.db.update(userBalance).set(data).where(eq(userBalance.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userBalance)
      .where(eq(userBalance.id, id));

    return result.rowsAffected > 0;
  }
}
