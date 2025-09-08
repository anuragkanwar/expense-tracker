import { expenseSplit } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpenseSplitResponse,
  ExpenseSplitCreate,
  ExpenseSplitUpdate,
} from "@/models/expense-split";
import { type DBType, type DBTransactionType } from "@/db";

export class ExpenseSplitRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<ExpenseSplitResponse[]> {
    const db = tx ?? this.db;
    const result = await db
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

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<ExpenseSplitResponse | null> {
    const db = tx ?? this.db;
    const result = await db
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

  async findByExpenseId(
    expenseId: number,
    tx?: DBTransactionType
  ): Promise<ExpenseSplitResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(expenseSplit)
      .where(eq(expenseSplit.expenseId, expenseId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpenseSplitResponse[];
  }

  async create(
    data: ExpenseSplitCreate,
    tx?: DBTransactionType
  ): Promise<ExpenseSplitResponse> {
    const db = tx ?? this.db;
    const result = await db.insert(expenseSplit).values(data).returning();

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
    data: ExpenseSplitUpdate,
    tx?: DBTransactionType
  ): Promise<ExpenseSplitResponse | null> {
    const db = tx ?? this.db;
    await db.update(expenseSplit).set(data).where(eq(expenseSplit.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(expenseSplit).where(eq(expenseSplit.id, id));

    return result.rowsAffected > 0;
  }
}
