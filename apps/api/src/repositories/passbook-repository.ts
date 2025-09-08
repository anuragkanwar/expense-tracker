import { transaction, transactionEntry, transactionAccount } from "@/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { type DBType, type DBTransactionType } from "@/db";
import { TransactionResponse } from "@/models/transaction";
import { TransactionAccountResponse } from "@/models/transaction-account";

export interface PassbookFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  accountId?: number;
}

// Custom response type for passbook entries with related data
export interface PassbookEntryResponse {
  id: number;
  amount: number;
  transactionAccountId: number;
  transactionId: number;
  createdAt: string;
  updatedAt: string;
  transaction: TransactionResponse;
  transactionAccount: TransactionAccountResponse;
}

export interface PassbookQueryResult {
  entries: PassbookEntryResponse[];
  total: number;
  page: number;
  limit: number;
}

export class PassbookRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async getPassbookEntries(
    userId: number,
    page: number = 1,
    limit: number = 20,
    filters: PassbookFilters = {},
    tx?: DBTransactionType
  ): Promise<PassbookQueryResult> {
    const db = tx ?? this.db;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(transaction.userId, userId)];

    if (filters.startDate) {
      whereConditions.push(gte(transaction.transactionDate, filters.startDate));
    }

    if (filters.endDate) {
      whereConditions.push(lte(transaction.transactionDate, filters.endDate));
    }

    if (filters.categoryId) {
      whereConditions.push(eq(transactionAccount.id, filters.categoryId));
    }

    if (filters.accountId) {
      whereConditions.push(eq(transactionAccount.id, filters.accountId));
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactionEntry)
      .innerJoin(
        transaction,
        eq(transactionEntry.transactionId, transaction.id)
      )
      .innerJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated entries
    const entriesResult = await db
      .select({
        // Transaction Entry fields
        id: transactionEntry.id,
        amount: transactionEntry.amount,
        transactionAccountId: transactionEntry.transactionAccountId,
        transactionId: transactionEntry.transactionId,
        createdAt: transactionEntry.createdAt,
        updatedAt: transactionEntry.updatedAt,
        // Transaction fields
        transactionDescription: transaction.description,
        transactionDate: transaction.transactionDate,
        transactionUserId: transaction.userId,
        transactionCreatedAt: transaction.createdAt,
        transactionUpdatedAt: transaction.updatedAt,
        // Transaction Account fields
        accountId: transactionAccount.id,
        accountName: transactionAccount.name,
        accountType: transactionAccount.type,
        accountBalance: transactionAccount.balance,
        accountCurrency: transactionAccount.currency,
        accountUserId: transactionAccount.userId,
        accountIsPaymentSource: transactionAccount.isPaymentSource,
        accountCreatedAt: transactionAccount.createdAt,
        accountUpdatedAt: transactionAccount.updatedAt,
      })
      .from(transactionEntry)
      .innerJoin(
        transaction,
        eq(transactionEntry.transactionId, transaction.id)
      )
      .innerJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .where(and(...whereConditions))
      .orderBy(desc(transaction.transactionDate), desc(transactionEntry.id))
      .limit(limit)
      .offset(offset);

    // Transform to response format
    const entries: PassbookEntryResponse[] = entriesResult.map((row) => ({
      id: row.id,
      amount: row.amount,
      transactionAccountId: row.transactionAccountId,
      transactionId: row.transactionId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      // Include related transaction and account data
      transaction: {
        id: row.transactionId,
        description: row.transactionDescription,
        transactionDate: row.transactionDate?.toISOString(),
        userId: row.transactionUserId,
        createdAt: row.transactionCreatedAt.toISOString(),
        updatedAt: row.transactionUpdatedAt.toISOString(),
      },
      transactionAccount: {
        id: row.accountId,
        name: row.accountName,
        type: row.accountType,
        balance: row.accountBalance,
        currency: row.accountCurrency,
        userId: row.accountUserId,
        isPaymentSource: row.accountIsPaymentSource,
        createdAt: row.accountCreatedAt.toISOString(),
        updatedAt: row.accountUpdatedAt.toISOString(),
      },
    }));

    return {
      entries,
      total,
      page,
      limit,
    };
  }

  async getPassbookEntryById(
    userId: number,
    entryId: number,
    tx?: DBTransactionType
  ): Promise<PassbookEntryResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select({
        // Transaction Entry fields
        id: transactionEntry.id,
        amount: transactionEntry.amount,
        transactionAccountId: transactionEntry.transactionAccountId,
        transactionId: transactionEntry.transactionId,
        createdAt: transactionEntry.createdAt,
        updatedAt: transactionEntry.updatedAt,
        // Transaction fields
        transactionDescription: transaction.description,
        transactionDate: transaction.transactionDate,
        transactionUserId: transaction.userId,
        transactionCreatedAt: transaction.createdAt,
        transactionUpdatedAt: transaction.updatedAt,
        // Transaction Account fields
        accountId: transactionAccount.id,
        accountName: transactionAccount.name,
        accountType: transactionAccount.type,
        accountBalance: transactionAccount.balance,
        accountCurrency: transactionAccount.currency,
        accountUserId: transactionAccount.userId,
        accountIsPaymentSource: transactionAccount.isPaymentSource,
        accountCreatedAt: transactionAccount.createdAt,
        accountUpdatedAt: transactionAccount.updatedAt,
      })
      .from(transactionEntry)
      .innerJoin(
        transaction,
        eq(transactionEntry.transactionId, transaction.id)
      )
      .innerJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .where(
        and(eq(transactionEntry.id, entryId), eq(transaction.userId, userId))
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return {
      id: row.id,
      amount: row.amount,
      transactionAccountId: row.transactionAccountId,
      transactionId: row.transactionId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      transaction: {
        id: row.transactionId,
        description: row.transactionDescription,
        transactionDate: row.transactionDate?.toISOString(),
        userId: row.transactionUserId,
        createdAt: row.transactionCreatedAt.toISOString(),
        updatedAt: row.transactionUpdatedAt.toISOString(),
      },
      transactionAccount: {
        id: row.accountId,
        name: row.accountName,
        type: row.accountType,
        balance: row.accountBalance,
        currency: row.accountCurrency,
        userId: row.accountUserId,
        isPaymentSource: row.accountIsPaymentSource,
        createdAt: row.accountCreatedAt.toISOString(),
        updatedAt: row.accountUpdatedAt.toISOString(),
      },
    };
  }
}
