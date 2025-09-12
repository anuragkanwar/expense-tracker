import { ACCOUNT_TYPE, transactionAccount } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  TransactionAccountResponse,
  TransactionAccountCreate,
  TransactionAccountUpdate,
} from "@/models/transaction-account";
import { type DBType, type DBTransactionType } from "@/db";

export class TransactionAccountRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionAccount)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionAccountResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionAccount)
      .where(eq(transactionAccount.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async getSpecialAccountByUserIdAndAccountType(
    userId: number,
    accountType: ACCOUNT_TYPE,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    const db = tx ?? this.db;
    if (accountType === ACCOUNT_TYPE.EXPENSE) {
      return null;
    }

    const result = await db
      .select()
      .from(transactionAccount)
      .where(
        and(
          eq(transactionAccount.type, accountType),
          eq(transactionAccount.userId, userId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async findByUserIdAndAccountId(
    userId: number,
    accountId: number,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionAccount)
      .where(
        and(
          eq(transactionAccount.userId, userId),
          eq(transactionAccount.id, accountId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async findByUserIdAndCategoryName(
    userId: number,
    categoryName: string,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionAccount)
      .where(
        and(
          eq(transactionAccount.userId, userId),
          eq(transactionAccount.name, categoryName)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionAccount)
      .where(eq(transactionAccount.userId, userId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as TransactionAccountResponse[];
  }

  async create(
    data: TransactionAccountCreate,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse> {
    const db = tx ?? this.db;
    const result = await db.insert(transactionAccount).values(data).returning();

    if (result.length === 0) {
      throw new Error("Failed to create transaction account");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async update(
    id: number,
    data: TransactionAccountUpdate,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(transactionAccount)
      .set(data)
      .where(eq(transactionAccount.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .delete(transactionAccount)
      .where(eq(transactionAccount.id, id));

    return result.rowsAffected > 0;
  }
}
