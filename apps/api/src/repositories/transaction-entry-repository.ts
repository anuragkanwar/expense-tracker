import { transactionEntry } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import {
  TransactionEntryResponse,
  TransactionEntryCreate,
  TransactionEntryUpdate,
} from "@/models/transaction-entry";
import { db as DATABASE } from "@pocket-pixie/db";

export class TransactionEntryRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionEntryResponse[]> {
    const result = await this.db
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

  async findById(id: number): Promise<TransactionEntryResponse | null> {
    const result = await this.db
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
    transactionId: number
  ): Promise<TransactionEntryResponse[]> {
    const result = await this.db
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
    data: TransactionEntryCreate
  ): Promise<TransactionEntryResponse> {
    const result = await this.db
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
    data: TransactionEntryUpdate
  ): Promise<TransactionEntryResponse | null> {
    await this.db
      .update(transactionEntry)
      .set(data)
      .where(eq(transactionEntry.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(transactionEntry)
      .where(eq(transactionEntry.id, id));

    return result.rowsAffected > 0;
  }
}
