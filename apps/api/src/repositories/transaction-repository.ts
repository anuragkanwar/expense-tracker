import { transaction } from "@/db";
import { eq } from "drizzle-orm";
import {
  TransactionResponse,
  TransactionCreate,
  TransactionUpdate,
} from "@/models/transaction";
import { type DBType, type DBTransactionType } from "@/db";

export class TransactionRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<TransactionResponse[]> {
    const db = tx ?? this.db;
    const result = await db
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

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<TransactionResponse | null> {
    const db = tx ?? this.db;
    const result = await db
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

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<TransactionResponse[]> {
    const db = tx ?? this.db;
    const result = await db
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

  async create(
    data: TransactionCreate,
    tx?: DBTransactionType
  ): Promise<TransactionResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
    };

    const result = await db.insert(transaction).values(insertData).returning();

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
    data: TransactionUpdate,
    tx?: DBTransactionType
  ): Promise<TransactionResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
    };

    await db.update(transaction).set(updateData).where(eq(transaction.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(transaction).where(eq(transaction.id, id));

    return result.rowsAffected > 0;
  }
}
