import { expense } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpenseResponse,
  ExpenseCreate,
  ExpenseUpdate,
} from "@/models/expense";
import { db as DATABASE } from "@/db";

export class ExpenseRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<ExpenseResponse[]> {
    const result = await this.db
      .select()
      .from(expense)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      expenseDate: item.expenseDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpenseResponse[];
  }

  async findById(id: number): Promise<ExpenseResponse | null> {
    const result = await this.db
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

  async create(data: ExpenseCreate): Promise<ExpenseResponse> {
    const insertData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    };

    const result = await this.db.insert(expense).values(insertData).returning();

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
    data: ExpenseUpdate
  ): Promise<ExpenseResponse | null> {
    const updateData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    };

    await this.db.update(expense).set(updateData).where(eq(expense.id, id));

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(expense).where(eq(expense.id, id));

    return result.rowsAffected > 0;
  }
}
