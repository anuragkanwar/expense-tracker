import { budget } from "@/db";
import { eq } from "drizzle-orm";
import { BudgetResponse, BudgetCreate, BudgetUpdate } from "@/models/budget";
import { type DBType, type DBTransactionType } from "@/db";

export class BudgetRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<BudgetResponse[]> {
    const db = tx ?? this.db;
    const result = await db.select().from(budget).limit(limit).offset(offset);
    return result.map((row) => ({
      ...row,
      startDate: row.startDate?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<BudgetResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(budget)
      .where(eq(budget.id, id))
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
      startDate: row.startDate?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(
    data: BudgetCreate,
    tx?: DBTransactionType
  ): Promise<BudgetResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(budget)
      .values({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      })
      .returning({ id: budget.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create budget");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create budget");
    }

    return created;
  }

  async update(
    id: number,
    data: BudgetUpdate,
    tx?: DBTransactionType
  ): Promise<BudgetResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(budget)
      .set({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      })
      .where(eq(budget.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(budget).where(eq(budget.id, id));

    return result.rowsAffected > 0;
  }
}
