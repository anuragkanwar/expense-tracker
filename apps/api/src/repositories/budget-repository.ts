import { budget } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import { BudgetResponse, BudgetCreate, BudgetUpdate } from "@/models/budget";
import { db as DATABASE } from "@pocket-pixie/db";

export class BudgetRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<BudgetResponse[]> {
    const result = await this.db
      .select()
      .from(budget)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      startDate: row.startDate?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as BudgetResponse[];
  }

  async findById(id: number): Promise<BudgetResponse | null> {
    const result = await this.db
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
    } as BudgetResponse;
  }

  async create(data: BudgetCreate): Promise<BudgetResponse> {
    const result = await this.db
      .insert(budget)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      })
      .returning({ id: budget.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create budget");
    }

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create budget");
    }

    return created;
  }

  async update(id: number, data: BudgetUpdate): Promise<BudgetResponse | null> {
    await this.db
      .update(budget)
      .set({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      })
      .where(eq(budget.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(budget).where(eq(budget.id, id));

    return result.rowsAffected > 0;
  }
}
