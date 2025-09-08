import { expense } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpenseResponse,
  ExpenseCreate,
  ExpenseUpdate,
} from "@/models/expense";
import { type DBType, type DBTransactionType } from "@/db";

export class ExpenseRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<ExpenseResponse[]> {
    const db = tx ?? this.db;
    const result = await db.select().from(expense).limit(limit).offset(offset);
    return result.map((item) => ({
      ...item,
      expenseDate: item.expenseDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpenseResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<ExpenseResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(expense)
      .where(eq(expense.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      expenseDate: item.expenseDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as any;
  }

  async create(
    data: ExpenseCreate,
    tx?: DBTransactionType
  ): Promise<ExpenseResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    };

    const result = await db.insert(expense).values(insertData).returning();

    if (result.length === 0) {
      throw new Error("Failed to create expense");
    }

    const item = result[0]!;
    return {
      ...item,
      expenseDate: item.expenseDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as any;
  }

  async update(
    id: number,
    data: ExpenseUpdate,
    tx?: DBTransactionType
  ): Promise<ExpenseResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    };

    await db.update(expense).set(updateData).where(eq(expense.id, id));

    return await this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(expense).where(eq(expense.id, id));

    return result.rowsAffected > 0;
  }
}
