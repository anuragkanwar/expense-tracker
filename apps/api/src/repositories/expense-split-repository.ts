import { expenseSplit } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpenseSplitResponse,
  ExpenseSplitCreate,
  ExpenseSplitUpdate,
} from "@/models/expense-split";
import { db as DATABASE } from "@/db";

export class ExpenseSplitRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<ExpenseSplitResponse[]> {
    const result = await this.db
      .select()
      .from(expenseSplit)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpenseSplitResponse[];
  }

  async findById(id: number): Promise<ExpenseSplitResponse | null> {
    const result = await this.db
      .select()
      .from(expenseSplit)
      .where(eq(expenseSplit.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as ExpenseSplitResponse;
  }

  async findByExpenseId(expenseId: number): Promise<ExpenseSplitResponse[]> {
    const result = await this.db
      .select()
      .from(expenseSplit)
      .where(eq(expenseSplit.expenseId, expenseId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpenseSplitResponse[];
  }

  async create(data: ExpenseSplitCreate): Promise<ExpenseSplitResponse> {
    const result = await this.db.insert(expenseSplit).values(data).returning();

    if (result.length === 0) {
      throw new Error("Failed to create expense split");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as ExpenseSplitResponse;
  }

  async update(
    id: number,
    data: ExpenseSplitUpdate
  ): Promise<ExpenseSplitResponse | null> {
    await this.db.update(expenseSplit).set(data).where(eq(expenseSplit.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(expenseSplit)
      .where(eq(expenseSplit.id, id));

    return result.rowsAffected > 0;
  }
}
