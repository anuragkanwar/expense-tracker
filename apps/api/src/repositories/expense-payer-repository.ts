import { expensePayer } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpensePayerResponse,
  ExpensePayerCreate,
  ExpensePayerUpdate,
} from "@/models/expense-payer";
import { type DBType, type DBTransactionType } from "@/db";

export class ExpensePayerRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<ExpensePayerResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(expensePayer)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpensePayerResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<ExpensePayerResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(expensePayer)
      .where(eq(expensePayer.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as ExpensePayerResponse;
  }

  async findByExpenseId(
    expenseId: number,
    tx?: DBTransactionType
  ): Promise<ExpensePayerResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(expensePayer)
      .where(eq(expensePayer.expenseId, expenseId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpensePayerResponse[];
  }

  async create(
    data: ExpensePayerCreate,
    tx?: DBTransactionType
  ): Promise<ExpensePayerResponse> {
    const db = tx ?? this.db;
    const result = await db.insert(expensePayer).values(data).returning();

    if (result.length === 0) {
      throw new Error("Failed to create expense payer");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as ExpensePayerResponse;
  }

  async update(
    id: number,
    data: ExpensePayerUpdate,
    tx?: DBTransactionType
  ): Promise<ExpensePayerResponse | null> {
    const db = tx ?? this.db;
    await db.update(expensePayer).set(data).where(eq(expensePayer.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(expensePayer).where(eq(expensePayer.id, id));

    return result.rowsAffected > 0;
  }
}
