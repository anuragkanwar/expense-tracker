import { expensePayer } from "@/db";
import { eq } from "drizzle-orm";
import {
  ExpensePayerResponse,
  ExpensePayerCreate,
  ExpensePayerUpdate,
} from "@/models/expense-payer";
import { db as DATABASE } from "@/db";

export class ExpensePayerRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<ExpensePayerResponse[]> {
    const result = await this.db
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

  async findById(id: number): Promise<ExpensePayerResponse | null> {
    const result = await this.db
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

  async findByExpenseId(expenseId: number): Promise<ExpensePayerResponse[]> {
    const result = await this.db
      .select()
      .from(expensePayer)
      .where(eq(expensePayer.expenseId, expenseId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as ExpensePayerResponse[];
  }

  async create(data: ExpensePayerCreate): Promise<ExpensePayerResponse> {
    const result = await this.db.insert(expensePayer).values(data).returning();

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
    data: ExpensePayerUpdate
  ): Promise<ExpensePayerResponse | null> {
    await this.db.update(expensePayer).set(data).where(eq(expensePayer.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(expensePayer)
      .where(eq(expensePayer.id, id));

    return result.rowsAffected > 0;
  }
}
