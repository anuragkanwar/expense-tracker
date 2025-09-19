import { expenseShare } from "@/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  lte,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import { type DBType, type DBTransactionType } from "@/db";
import {
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  SHARE_TYPE,
  SPLIT_TYPE,
} from "@/db";

// Import types from contracts
import type {
  LoanResponse as OriginalLoanResponse,
  LoanFilters,
  ExpenseShareRepoCreate,
  ExpenseShareRepoUpdate,
  ExpenseShareRepoResponse,
} from "@pocket-pixie/contracts";

// Drizzle inferred row type
type ExpenseShareSelect = typeof expenseShare.$inferSelect;

// Using types from contracts package

export class ExpenseShareRepository {
  private db: DBType;

  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  private map(row: ExpenseShareSelect): ExpenseShareRepoResponse {
    if (!row) {
      throw new Error("Cannot map undefined row");
    }
    return {
      ...row,
      realizedAt: row.realizedAt ? row.realizedAt.toISOString() : null,
      loanDate: row.loanDate ? row.loanDate.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as ExpenseShareRepoResponse;
  }

  private mapToLoanResponse(
    item: ExpenseShareRepoResponse
  ): OriginalLoanResponse {
    return {
      id: item.id,
      description: item.description || "",
      amount: item.amount,
      currency: item.currency,
      createdBy: item.payerUserId,
      transactionId: item.transactionId,
      groupId: item.groupId || null,
      loanDate: item.loanDate || null,
      creditorId: item.payerUserId,
      debtorId: item.participantUserId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    } as OriginalLoanResponse;
  }

  async createMany(
    data: ExpenseShareRepoCreate[],
    tx?: DBTransactionType
  ): Promise<ExpenseShareRepoResponse[]> {
    if (!data.length) return [];
    const db = tx ?? this.db;

    const rows = await db
      .insert(expenseShare)
      .values(
        data.map((d) => ({
          transactionId: d.transactionId,
          payerUserId: d.payerUserId,
          participantUserId: d.participantUserId,
          groupId: d.groupId ?? null,
          type: d.type ?? EXPENSE_SHARE_TYPE.EXPENSE,
          description: d.description ?? null,
          shareType: d.shareType ?? null,
          splitType: d.splitType ?? null,
          expenseAccountId: d.expenseAccountId ?? null,
          currency: d.currency,
          amount: d.amount,
          paidAmount: d.paidAmount ?? 0,
          status: d.status ?? EXPENSE_SHARE_STATUS.UNPAID,
          realizedAt: d.realizedAt ?? null,
          loanDate: d.loanDate ?? null,
          isPayerShare: d.isPayerShare ?? 0,
          metadata: d.metadata ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .returning();

    return rows.map((r) => this.map(r));
  }

  async createLoan(
    data: {
      transactionId: number;
      creditorId: number;
      debtorId: number;
      amount: number;
      currency: string;
      description?: string;
      groupId?: number | null;
      loanDate?: Date | null;
    },
    tx?: DBTransactionType
  ): Promise<OriginalLoanResponse> {
    const {
      transactionId,
      creditorId,
      debtorId,
      amount,
      currency,
      description,
      groupId,
      loanDate,
    } = data;

    const shareData: ExpenseShareRepoCreate = {
      transactionId,
      payerUserId: creditorId, // Creditor is always the payer in a loan
      participantUserId: debtorId, // Debtor is the participant
      groupId,
      type: EXPENSE_SHARE_TYPE.LOAN,
      description,
      currency,
      amount,
      loanDate,
      isPayerShare: 0, // Not the payer's share as it's a debt
      status: EXPENSE_SHARE_STATUS.UNPAID,
    };

    const result = await this.createMany([shareData], tx);
    if (!result || result.length === 0 || !result[0]) {
      throw new Error("Failed to create loan");
    }

    return this.mapToLoanResponse(result[0]);
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<ExpenseShareRepoResponse | null> {
    const db = tx ?? this.db;
    const rows = await db
      .select()
      .from(expenseShare)
      .where(eq(expenseShare.id, id))
      .limit(1);

    if (!rows.length || rows.length === 0 || !rows[0]) return null;
    return this.map(rows[0]);
  }

  async findLoanById(
    id: number,
    tx?: DBTransactionType
  ): Promise<OriginalLoanResponse | null> {
    const share = await this.findById(id, tx);
    if (!share || share.type !== EXPENSE_SHARE_TYPE.LOAN) return null;
    return this.mapToLoanResponse(share);
  }

  /**
   * Find allocatable expense shares for settlement allocation
   *
   * @param debtorId The user who is making the payment (participant)
   * @param creditorId The user who is receiving the payment (payer)
   * @param currency The currency filter
   * @param groupId Optional group ID filter
   * @param type Optional type filter (EXPENSE or LOAN)
   * @param tx Optional transaction context
   * @returns Array of allocatable expense shares in FIFO order
   */
  async findAllocatableShares(
    debtorId: number,
    creditorId: number,
    currency: string,
    groupId: number | null = null,
    type: EXPENSE_SHARE_TYPE | null = null,
    tx?: DBTransactionType
  ): Promise<ExpenseShareRepoResponse[]> {
    const db = tx ?? this.db;

    // Build query conditions
    const conditions: SQL[] = [
      // Debtor is the participant who owes money
      eq(expenseShare.participantUserId, debtorId),
      // Creditor is the original payer
      eq(expenseShare.payerUserId, creditorId),
      // Only match the specified currency
      eq(expenseShare.currency, currency),
      // Only unpaid or partially paid shares
      or(
        eq(expenseShare.status, EXPENSE_SHARE_STATUS.UNPAID),
        eq(expenseShare.status, EXPENSE_SHARE_STATUS.PARTIALLY_PAID)
      ) as SQL<unknown>,
      // Never allocate payer's own share
      eq(expenseShare.isPayerShare, 0),
      // Must have some remaining amount to pay
      gt(
        expenseShare.amount as unknown as SQL<number>,
        expenseShare.paidAmount as unknown as SQL<number>
      ),
    ];

    // Apply group filter
    if (groupId === null) {
      conditions.push(isNull(expenseShare.groupId));
    } else {
      conditions.push(eq(expenseShare.groupId, groupId));
    }

    // Apply type filter if specified
    if (type !== null) {
      conditions.push(eq(expenseShare.type, type));
    }

    // Fetch shares with FIFO ordering
    const rows = await db
      .select()
      .from(expenseShare)
      .where(and(...conditions))
      .orderBy(
        // Primary sort by realizedAt for FIFO
        asc(expenseShare.realizedAt),
        // Secondary sort by ID for consistent ordering of same-time shares
        asc(expenseShare.id)
      );

    return rows.map((row: typeof expenseShare.$inferSelect) => this.map(row));
  }

  async findLoans(
    filters: LoanFilters = {},
    tx?: DBTransactionType
  ): Promise<OriginalLoanResponse[]> {
    const {
      userId,
      groupId,
      isPersonal = true,
      asCreditor = true,
      asDebtor = true,
      limit = 10,
      offset = 0,
      sortOrder = "desc",
      friendId,
    } = filters;

    const db = tx ?? this.db;

    // Handle friend-specific view as a special case
    if (userId && friendId) {
      return this.findLoansBetweenUsers(
        userId,
        friendId,
        { limit, offset },
        tx
      );
    }

    // Start with base condition - must be a loan
    const conditions: SQL<unknown>[] = [
      eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
    ];

    // Add user role conditions
    if (userId) {
      const userConditions: SQL<unknown>[] = [];

      if (asCreditor) {
        userConditions.push(eq(expenseShare.payerUserId, userId));
      }

      if (asDebtor) {
        userConditions.push(eq(expenseShare.participantUserId, userId));
      }

      if (userConditions.length > 0) {
        conditions.push(or(...userConditions) as SQL<unknown>);
      }
    }

    // Add group context conditions
    if (groupId !== undefined) {
      if (groupId === null) {
        // Personal loans
        conditions.push(isNull(expenseShare.groupId));
      } else {
        // Group loans
        conditions.push(eq(expenseShare.groupId, groupId));
      }
    } else if (isPersonal) {
      conditions.push(isNull(expenseShare.groupId));
    }

    const rows = await db
      .select()
      .from(expenseShare)
      .where(and(...conditions))
      .orderBy(
        sortOrder === "asc"
          ? asc(expenseShare.createdAt)
          : desc(expenseShare.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => this.mapToLoanResponse(this.map(row)));
  }

  async findLoansBetweenUsers(
    user1Id: number,
    user2Id: number,
    options: { limit?: number; offset?: number } = {},
    tx?: DBTransactionType
  ): Promise<OriginalLoanResponse[]> {
    const { limit = 10, offset = 0 } = options;
    const db = tx ?? this.db;

    // Create user conditions separately to ensure they are well-typed
    const userConditions: SQL<unknown>[] = [];

    // User 1 as creditor, User 2 as debtor
    userConditions.push(
      and(
        eq(expenseShare.payerUserId, user1Id),
        eq(expenseShare.participantUserId, user2Id)
      ) as SQL<unknown>
    );

    // User 2 as creditor, User 1 as debtor
    userConditions.push(
      and(
        eq(expenseShare.payerUserId, user2Id),
        eq(expenseShare.participantUserId, user1Id)
      ) as SQL<unknown>
    );

    // Find loans in both directions
    const rows = await db
      .select()
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
          or(...userConditions) as SQL<unknown>
        )
      )
      .orderBy(desc(expenseShare.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => this.mapToLoanResponse(this.map(row)));
  }

  async countLoans(
    filters: LoanFilters = {},
    tx?: DBTransactionType
  ): Promise<number> {
    const {
      userId,
      groupId,
      isPersonal = true,
      asCreditor = true,
      asDebtor = true,
      friendId,
    } = filters;

    const db = tx ?? this.db;

    // Special case: count between two users
    if (userId && friendId) {
      // Create user conditions separately to ensure they are well-typed
      const userConditions: SQL<unknown>[] = [];

      // User as creditor, Friend as debtor
      userConditions.push(
        and(
          eq(expenseShare.payerUserId, userId),
          eq(expenseShare.participantUserId, friendId)
        ) as SQL<unknown>
      );

      // Friend as creditor, User as debtor
      userConditions.push(
        and(
          eq(expenseShare.payerUserId, friendId),
          eq(expenseShare.participantUserId, userId)
        ) as SQL<unknown>
      );

      const result = await db
        .select({ value: count() })
        .from(expenseShare)
        .where(
          and(
            eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
            or(...userConditions) as SQL<unknown>
          )
        );

      return Number(result[0]?.value || 0);
    }

    // Start with base condition
    const conditions: SQL<unknown>[] = [
      eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
    ];

    // Add group context conditions
    if (groupId !== undefined) {
      if (groupId === null) {
        conditions.push(isNull(expenseShare.groupId));
      } else {
        conditions.push(eq(expenseShare.groupId, groupId));
      }
    } else if (isPersonal) {
      conditions.push(isNull(expenseShare.groupId));
    }

    // Add user role conditions
    if (userId) {
      const userConditions: SQL<unknown>[] = [];

      if (asCreditor) {
        userConditions.push(eq(expenseShare.payerUserId, userId));
      }

      if (asDebtor) {
        userConditions.push(eq(expenseShare.participantUserId, userId));
      }

      if (userConditions.length > 0) {
        conditions.push(or(...userConditions) as SQL<unknown>);
      }
    }

    const result = await db
      .select({ value: count() })
      .from(expenseShare)
      .where(and(...conditions));

    return Number(result[0]?.value || 0);
  }

  async update(
    id: number,
    data: ExpenseShareRepoUpdate,
    tx?: DBTransactionType
  ): Promise<ExpenseShareRepoResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(expenseShare)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(expenseShare.id, id));

    // Get updated record
    const updatedRecord = await this.findById(id, tx);
    if (!updatedRecord) return null;
    return updatedRecord;
  }

  async updateLoan(
    id: number,
    data: Partial<{
      description: string;
      amount: number;
      currency: string;
      paidAmount: number;
      status: EXPENSE_SHARE_STATUS;
    }>,
    tx?: DBTransactionType
  ): Promise<OriginalLoanResponse | null> {
    const updated = await this.update(id, data, tx);
    if (!updated || updated.type !== EXPENSE_SHARE_TYPE.LOAN) return null;
    return this.mapToLoanResponse(updated);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .delete(expenseShare)
      .where(eq(expenseShare.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Update an expense share's payment status and paid amount
   *
   * @param id The expense share ID
   * @param paidAmount New paid amount
   * @param status New payment status
   * @param tx Optional transaction context
   * @returns The updated expense share record
   */
  async updateSharePayment(
    id: number,
    paidAmount: number,
    status: EXPENSE_SHARE_STATUS,
    tx?: DBTransactionType
  ): Promise<ExpenseShareRepoResponse | null> {
    return this.update(
      id,
      {
        paidAmount,
        status,
      },
      tx
    );
  }

  /**
   * Get expense shares for a user for passbook integration
   *
   * @param userId The user ID
   * @param page Page number (1-indexed)
   * @param limit Results per page
   * @param filters Optional date range filters
   * @param tx Optional transaction context
   * @returns Expense shares where user is either payer or participant
   */
  async getExpenseSharesForPassbook(
    userId: number,
    page: number = 1,
    limit: number = 20,
    filters: { startDate?: Date; endDate?: Date } = {},
    tx?: DBTransactionType
  ): Promise<{
    shares: ExpenseShareRepoResponse[];
    total: number;
  }> {
    const db = tx ?? this.db;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: SQL<unknown>[] = [
      or(
        eq(expenseShare.payerUserId, userId),
        eq(expenseShare.participantUserId, userId)
      ) as SQL<unknown>,
    ];

    // Add date filters if provided
    if (filters.startDate) {
      conditions.push(
        gte(expenseShare.createdAt, filters.startDate) as SQL<unknown>
      );
    }

    if (filters.endDate) {
      conditions.push(
        lte(expenseShare.createdAt, filters.endDate) as SQL<unknown>
      );
    }

    // Count total
    const countResult = await db
      .select({ value: count() })
      .from(expenseShare)
      .where(and(...conditions));

    const total = Number(countResult[0]?.value || 0);

    // Get paginated results
    const rows = await db
      .select()
      .from(expenseShare)
      .where(and(...conditions))
      .orderBy(desc(expenseShare.createdAt))
      .limit(limit)
      .offset(offset);

    const shares = rows.map((row) => this.map(row));

    return {
      shares,
      total,
    };
  }
}
