import { transaction } from "@/db";
import { eq } from "drizzle-orm";
import {
  TransactionResponse,
  TransactionCreate,
  TransactionUpdate,
} from "@/models/transaction";
import { db as DATABASE } from "@/db";

export class TransactionRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionResponse[]> {
    const result = await this.db
      .select()
      .from(transaction)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      transactionDate: item.transactionDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionResponse[];
  }

  async findById(id: number): Promise<TransactionResponse | null> {
    const result = await this.db
      .select()
      .from(transaction)
      .where(eq(transaction.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      transactionDate: item.transactionDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionResponse;
  }

  async findByUserId(userId: number): Promise<TransactionResponse[]> {
    const result = await this.db
      .select()
      .from(transaction)
      .where(eq(transaction.userId, userId));
    return result.map((item) => ({
      ...item,
      transactionDate: item.transactionDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionResponse[];
  }

  async create(data: TransactionCreate): Promise<TransactionResponse> {
    const insertData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
    };

    const result = await this.db
      .insert(transaction)
      .values(insertData)
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to create transaction");
    }

    const item = result[0]!;
    return {
      ...item,
      transactionDate: item.transactionDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionResponse;
  }

  async update(
    id: number,
    data: TransactionUpdate
  ): Promise<TransactionResponse | null> {
    const updateData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
    };

    await this.db
      .update(transaction)
      .set(updateData)
      .where(eq(transaction.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(transaction)
      .where(eq(transaction.id, id));

    return result.rowsAffected > 0;
  }
}
