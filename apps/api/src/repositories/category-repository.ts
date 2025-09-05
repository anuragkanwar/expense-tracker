import { transactionCategory, TXN_CATEGORY, TXN_TYPE } from "@pocket-pixie/db";
import { eq, and, or, isNull } from "drizzle-orm";
import {
  TransactionCategoryResponse,
  TransactionCategoryCreate,
  TransactionCategoryUpdate,
} from "@/models/transaction-category";
import { db as DATABASE } from "@pocket-pixie/db";

export class CategoryRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionCategoryResponse[]> {
    const result = await this.db
      .select()
      .from(transactionCategory)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as TransactionCategoryResponse[];
  }

  async findByUserIdAndName(
    userId: number,
    categryName: TXN_CATEGORY
  ): Promise<TransactionCategoryResponse | null> {
    const result = await this.db
      .select()
      .from(transactionCategory)
      .where(
        and(
          or(
            isNull(transactionCategory.userId),
            eq(transactionCategory.userId, userId)
          ),
          eq(transactionCategory.name, categryName)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as TransactionCategoryResponse;
  }

  async findById(id: number): Promise<TransactionCategoryResponse | null> {
    const result = await this.db
      .select()
      .from(transactionCategory)
      .where(eq(transactionCategory.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as TransactionCategoryResponse;
  }

  async create(
    data: TransactionCategoryCreate
  ): Promise<TransactionCategoryResponse> {
    const result = await this.db
      .insert(transactionCategory)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning({ id: transactionCategory.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create category");
    }

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create category");
    }

    return created;
  }

  async update(
    id: number,
    data: TransactionCategoryUpdate
  ): Promise<TransactionCategoryResponse | null> {
    await this.db
      .update(transactionCategory)
      .set(data)
      .where(eq(transactionCategory.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(transactionCategory)
      .where(eq(transactionCategory.id, id));

    return result.rowsAffected > 0;
  }
}
