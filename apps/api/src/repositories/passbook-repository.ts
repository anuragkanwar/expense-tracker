import {
  transaction,
  transactionEntry,
  transactionAccount,
  expenseShare,
  user,
} from "@/db";
import { eq, ne, and, gte, lte, desc, sql, or } from "drizzle-orm";
import {
  type DBType,
  type DBTransactionType,
  EXPENSE_SHARE_TYPE,
  ACCOUNT_TYPE,
  EXPENSE_SHARE_STATUS,
} from "@/db";
import type {
  PassbookFilters,
  PassbookEntryResponse,
  PassbookQueryResult,
} from "@pocket-pixie/contracts";

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

    // This function needs a special approach to pagination since we're combining
    // data from two different sources (transaction entries and expense shares)
    // Instead of paginating at the database level, we'll:
    // 1. Fetch all matching entries from both sources based on filters
    // 2. Combine and sort them
    // 3. Apply pagination to the combined result

    // Determine which types of entries to fetch based on entryType filter
    const includeTransactions =
      !filters.entryType ||
      filters.entryType === "all" ||
      filters.entryType === "transaction";

    const includeExpenseShares =
      !filters.entryType ||
      filters.entryType === "all" ||
      filters.entryType === "expense" ||
      filters.entryType === "loan";

    let transactionEntries: PassbookEntryResponse[] = [];
    let transactionTotal = 0;

    // Only fetch regular transactions if needed
    if (includeTransactions) {
      // Build where conditions for regular transactions
      const whereConditions = [eq(transaction.userId, userId)];

      if (filters.startDate) {
        whereConditions.push(
          gte(transaction.transactionDate, filters.startDate)
        );
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

      whereConditions.push(ne(transactionAccount.type, ACCOUNT_TYPE.EXTERNAL));
      whereConditions.push(ne(transactionAccount.type, ACCOUNT_TYPE.OUTGOING));

      // Get total count for regular transactions
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

      transactionTotal = totalResult[0]?.count || 0;

      // Get all matching regular transactions (with a reasonably high limit)
      // We'll handle the actual pagination after combining with expense shares
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
          transactionParentId: transaction.parentTransactionId,
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
        .limit(1000); // Higher limit to get most/all transactions

      // Transform regular transactions to response format
      transactionEntries = entriesResult.map((row) => ({
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
          parentTransactionId: row.transactionParentId || null,
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
        isExpenseShare: false,
      }));
    }

    let expenseShareEntries: PassbookEntryResponse[] = [];
    let expenseShareTotal = 0;

    // Only fetch expense shares if needed
    if (includeExpenseShares) {
      // Get expense share entries with modified date filters and a high limit to get most/all entries
      const dateFilters: { startDate?: Date; endDate?: Date } = {};

      if (filters.startDate) dateFilters.startDate = filters.startDate;
      if (filters.endDate) dateFilters.endDate = filters.endDate;

      const expenseShareResult = await this.getExpenseShareEntries(
        userId,
        1, // page
        1000, // high limit to get most/all matching entries
        { ...filters, ...dateFilters },
        tx
      );

      expenseShareTotal = expenseShareResult.total;
      expenseShareEntries = expenseShareResult.entries;

      // Additional filtering for expense/loan subtypes if needed
      if (filters.entryType === "expense") {
        expenseShareEntries = expenseShareEntries.filter(
          (entry) => entry.expenseShareType === EXPENSE_SHARE_TYPE.EXPENSE
        );
        expenseShareTotal = expenseShareEntries.length;
      } else if (filters.entryType === "loan") {
        expenseShareEntries = expenseShareEntries.filter(
          (entry) => entry.expenseShareType === EXPENSE_SHARE_TYPE.LOAN
        );
        expenseShareTotal = expenseShareEntries.length;
      }
    }

    // Combine both types of entries and sort by date
    const combinedEntries: PassbookEntryResponse[] = [
      ...transactionEntries,
      ...expenseShareEntries,
    ].sort((a, b) => {
      const dateA = new Date(a.transaction.transactionDate || a.createdAt);
      const dateB = new Date(b.transaction.transactionDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const totalEntries = transactionTotal + expenseShareTotal;

    // Apply pagination to combined results
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedEntries = combinedEntries.slice(startIdx, endIdx);

    return {
      entries: paginatedEntries,
      total: totalEntries,
      page,
      limit,
    };
  }

  /**
   * Get expense share entries formatted as passbook entries
   *
   * @param userId User ID
   * @param page Page number (1-indexed)
   * @param limit Results per page
   * @param filters Optional filters
   * @param tx Optional transaction context
   * @returns Formatted expense share entries and total count
   */
  private async getExpenseShareEntries(
    userId: number,
    page: number = 1,
    limit: number = 20,
    filters: PassbookFilters = {},
    tx?: DBTransactionType
  ): Promise<{
    entries: PassbookEntryResponse[];
    total: number;
  }> {
    const db = tx ?? this.db;
    const offset = (page - 1) * limit;

    // Build conditions for expense shares
    const conditions = [
      or(
        eq(expenseShare.payerUserId, userId),
        eq(expenseShare.participantUserId, userId)
      ),
    ];

    // Add date filters if provided
    if (filters.startDate) {
      conditions.push(gte(expenseShare.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(expenseShare.createdAt, filters.endDate));
    }

    // Add status filter if provided
    if (filters.status && filters.status !== "all") {
      // Convert to uppercase for DB enum matching
      const statusUppercase = filters.status.toUpperCase();
      conditions.push(
        eq(expenseShare.status, statusUppercase as EXPENSE_SHARE_STATUS)
      );
    }

    // Count total expense shares
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(expenseShare)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    // Get paginated expense shares with user details
    const rows = await db
      .select({
        // Expense Share fields
        id: expenseShare.id,
        transactionId: expenseShare.transactionId,
        payerUserId: expenseShare.payerUserId,
        participantUserId: expenseShare.participantUserId,
        groupId: expenseShare.groupId,
        type: expenseShare.type,
        description: expenseShare.description,
        currency: expenseShare.currency,
        amount: expenseShare.amount,
        status: expenseShare.status,
        createdAt: expenseShare.createdAt,
        updatedAt: expenseShare.updatedAt,
        // Join with transaction
        transactionDescription: transaction.description,
        transactionDate: transaction.transactionDate,
        transactionUserId: transaction.userId,
        transactionParentId: transaction.parentTransactionId,
        transactionCreatedAt: transaction.createdAt,
        transactionUpdatedAt: transaction.updatedAt,
        // Get payer and participant names (optional)
        payerName: user.name, // Will override in code
        participantName: user.name, // Will override in code
      })
      .from(expenseShare)
      .innerJoin(transaction, eq(expenseShare.transactionId, transaction.id))
      .leftJoin(user, eq(expenseShare.payerUserId, user.id))
      .where(and(...conditions))
      .orderBy(desc(expenseShare.createdAt))
      .limit(limit)
      .offset(offset);

    // Need to get user names for payers and participants
    const userIds = new Set<number>();
    rows.forEach((row) => {
      userIds.add(row.payerUserId);
      userIds.add(row.participantUserId);
    });

    // Fetch all relevant user names in a single query
    const userMap = new Map<number, string>();
    if (userIds.size > 0) {
      const users = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(or(...Array.from(userIds).map((id) => eq(user.id, id))));

      users.forEach((u) => {
        userMap.set(u.id, u.name || "Unknown User");
      });
    }

    // Transform expense shares to passbook entries
    const entries: PassbookEntryResponse[] = rows.map((row) => {
      // Determine if this is a debit or credit from the user's perspective
      const isUserPayer = row.payerUserId === userId;
      const displayAmount = isUserPayer ? -row.amount : row.amount;

      // Get proper names for payer and participant
      const payerName = userMap.get(row.payerUserId) || "Unknown User";
      const participantName =
        userMap.get(row.participantUserId) || "Unknown User";

      return {
        id: row.id,
        // Use the expense share ID as the "entry" ID
        amount: displayAmount,
        // Use placeholder values for transaction account (required by interface)
        transactionAccountId: -1, // Placeholder
        transactionId: row.transactionId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        // Include related transaction data
        transaction: {
          id: row.transactionId,
          description:
            row.type === EXPENSE_SHARE_TYPE.LOAN
              ? `Loan: ${row.description || "No description"}`
              : `Expense: ${row.description || "No description"}`,
          transactionDate: row.transactionDate?.toISOString(),
          userId: row.transactionUserId,
          parentTransactionId: row.transactionParentId || null,
          createdAt: row.transactionCreatedAt.toISOString(),
          updatedAt: row.transactionUpdatedAt.toISOString(),
        },
        // Use a placeholder transaction account
        transactionAccount: {
          id: -1,
          name: row.type === EXPENSE_SHARE_TYPE.LOAN ? "Loan" : "Expense Share",
          type: isUserPayer ? ACCOUNT_TYPE.EXPENSE : ACCOUNT_TYPE.INCOME,
          balance: 0,
          currency: row.currency,
          userId: userId,
          isPaymentSource: false,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        },
        // Add expense share specific data
        isExpenseShare: true,
        expenseShareType: row.type,
        expenseShareId: row.id,
        payerUserId: row.payerUserId,
        participantUserId: row.participantUserId,
        payerName: payerName,
        participantName: participantName,
        groupId: row.groupId || undefined,
        status: row.status || "UNKNOWN",
      };
    });

    return {
      entries,
      total,
    };
  }

  async getPassbookEntryById(
    userId: number,
    entryId: number,
    tx?: DBTransactionType
  ): Promise<PassbookEntryResponse | null> {
    const db = tx ?? this.db;

    // First check if it's a regular transaction entry
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
        transactionParentId: transaction.parentTransactionId,
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

    if (result.length > 0) {
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
          parentTransactionId: row.transactionParentId || null,
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
        isExpenseShare: false,
      };
    }

    // If not a regular transaction, check if it's an expense share
    // Using entryId as the expense share ID in this case
    const expenseShareRow = await db
      .select({
        // Expense Share fields
        id: expenseShare.id,
        transactionId: expenseShare.transactionId,
        payerUserId: expenseShare.payerUserId,
        participantUserId: expenseShare.participantUserId,
        groupId: expenseShare.groupId,
        type: expenseShare.type,
        description: expenseShare.description,
        currency: expenseShare.currency,
        amount: expenseShare.amount,
        status: expenseShare.status,
        createdAt: expenseShare.createdAt,
        updatedAt: expenseShare.updatedAt,
        // Join with transaction
        transactionDescription: transaction.description,
        transactionDate: transaction.transactionDate,
        transactionUserId: transaction.userId,
        transactionParentId: transaction.parentTransactionId,
        transactionCreatedAt: transaction.createdAt,
        transactionUpdatedAt: transaction.updatedAt,
      })
      .from(expenseShare)
      .innerJoin(transaction, eq(expenseShare.transactionId, transaction.id))
      .where(
        and(
          eq(expenseShare.id, entryId),
          or(
            eq(expenseShare.payerUserId, userId),
            eq(expenseShare.participantUserId, userId)
          )
        )
      )
      .limit(1);

    if (expenseShareRow.length === 0) {
      return null;
    }

    const row = expenseShareRow[0]!;

    // Get user names
    const userIds = [row.payerUserId, row.participantUserId];
    const users = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(or(...userIds.map((id) => eq(user.id, id))));

    const userMap = new Map<number, string>();
    users.forEach((u) => {
      userMap.set(u.id, u.name || "Unknown User");
    });

    // Determine if this is a debit or credit from the user's perspective
    const isUserPayer = row.payerUserId === userId;
    const displayAmount = isUserPayer ? -row.amount : row.amount;

    return {
      id: row.id,
      // Use the expense share ID as the "entry" ID
      amount: displayAmount,
      // Use placeholder values for transaction account (required by interface)
      transactionAccountId: -1, // Placeholder
      transactionId: row.transactionId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      // Include related transaction data
      transaction: {
        id: row.transactionId,
        description:
          row.type === EXPENSE_SHARE_TYPE.LOAN
            ? `Loan: ${row.description || "No description"}`
            : `Expense: ${row.description || "No description"}`,
        transactionDate: row.transactionDate?.toISOString(),
        userId: row.transactionUserId,
        parentTransactionId: row.transactionParentId || null,
        createdAt: row.transactionCreatedAt.toISOString(),
        updatedAt: row.transactionUpdatedAt.toISOString(),
      },
      // Use a placeholder transaction account
      transactionAccount: {
        id: -1,
        name: row.type === EXPENSE_SHARE_TYPE.LOAN ? "Loan" : "Expense Share",
        type: isUserPayer ? ACCOUNT_TYPE.EXPENSE : ACCOUNT_TYPE.INCOME,
        balance: 0,
        currency: row.currency,
        userId: userId,
        isPaymentSource: false,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
      // Add expense share specific data
      isExpenseShare: true,
      expenseShareType: row.type,
      expenseShareId: row.id,
      payerUserId: row.payerUserId,
      participantUserId: row.participantUserId,
      payerName: userMap.get(row.payerUserId) || "Unknown User",
      participantName: userMap.get(row.participantUserId) || "Unknown User",
      groupId: row.groupId || undefined,
      status: row.status || "UNKNOWN",
    };
  }
}
