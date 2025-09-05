import { ACCOUNT_TYPE, transactionAccount } from "@pocket-pixie/db";
import { and, eq } from "drizzle-orm";
import {
  TransactionAccountResponse,
  TransactionAccountCreate,
  TransactionAccountUpdate,
} from "@/models/transaction-account";
import { db as DATABASE } from "@pocket-pixie/db";

export class TransactionAccountRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionAccountResponse[]> {
    const result = await this.db
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

  async findById(id: number): Promise<TransactionAccountResponse | null> {
    const result = await this.db
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

  async findMainAccountByUser(
    userId: number
  ): Promise<TransactionAccountResponse | null> {
    let result = await this.db
      .select()
      .from(transactionAccount)
      .where(
        and(
          eq(transactionAccount.userId, userId),
          eq(transactionAccount.name, "MAIN")
        )
      )
      .limit(1);

    if (result.length === 0) {
      result = await this.db
        .insert(transactionAccount)
        .values({
          isPaymentSource: true,
          type: ACCOUNT_TYPE.INCOME,
          currency: "INR",
          name: "MAIN",
          userId: userId,
          balance: 0,
        })
        .returning();
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionAccountResponse;
  }

  async findExternalAccountByUser(
    userId: number
  ): Promise<TransactionAccountResponse | null> {
    let result = await this.db
      .select()
      .from(transactionAccount)
      .where(
        and(
          eq(transactionAccount.userId, userId),
          eq(transactionAccount.name, "EXTERNAL")
        )
      )
      .limit(1);

    if (result.length === 0) {
      result = await this.db
        .insert(transactionAccount)
        .values({
          isPaymentSource: true,
          type: ACCOUNT_TYPE.EXTERNAL,
          currency: "INR",
          name: "EXTERNAL",
          userId: userId,
          balance: 0,
        })
        .returning();
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
    categoryName: string
  ): Promise<TransactionAccountResponse | null> {
    const result = await this.db
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

  async findByUserId(userId: number): Promise<TransactionAccountResponse[]> {
    const result = await this.db
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
    data: TransactionAccountCreate
  ): Promise<TransactionAccountResponse> {
    const result = await this.db
      .insert(transactionAccount)
      .values(data)
      .returning();

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
    data: TransactionAccountUpdate
  ): Promise<TransactionAccountResponse | null> {
    await this.db
      .update(transactionAccount)
      .set(data)
      .where(eq(transactionAccount.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(transactionAccount)
      .where(eq(transactionAccount.id, id));

    return result.rowsAffected > 0;
  }
}
