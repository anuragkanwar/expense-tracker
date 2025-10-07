import { transactionEntry } from "@/db";
import { eq } from "drizzle-orm";
import type {
  TransactionEntryResponse,
  TransactionEntryCreate,
  TransactionEntryUpdate,
} from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";

export class TransactionEntryRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<TransactionEntryResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionEntry)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionEntryResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<TransactionEntryResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionEntry)
      .where(eq(transactionEntry.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionEntryResponse;
  }

  async findByTransactionId(
    transactionId: number,
    tx?: DBTransactionType
  ): Promise<TransactionEntryResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionEntry)
      .where(eq(transactionEntry.transactionId, transactionId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionEntryResponse[];
  }

  async create(
    data: TransactionEntryCreate,
    tx?: DBTransactionType
  ): Promise<TransactionEntryResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(transactionEntry)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to create transaction entry");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionEntryResponse;
  }

  async update(
    id: number,
    data: TransactionEntryUpdate,
    tx?: DBTransactionType
  ): Promise<TransactionEntryResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(transactionEntry)
      .set(data)
      .where(eq(transactionEntry.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .delete(transactionEntry)
      .where(eq(transactionEntry.id, id));

    return result.rowsAffected > 0;
  }
}
