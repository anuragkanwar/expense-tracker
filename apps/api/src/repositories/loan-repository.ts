import { loan, loanSplit } from "@/db";
import { and, asc, count, desc, eq, isNull, not, or, sql } from "drizzle-orm";
import type {
  LoanResponse,
  LoanCreate,
  LoanUpdate,
} from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";

// Define loan query filters for consistent query building
export type LoanFilters = {
  userId?: number;
  groupId?: number | null;
  isPersonal?: boolean;
  asCreditor?: boolean;
  asDebtor?: boolean;
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
  sortField?: "createdAt" | "loanDate" | "amount";
  friendId?: number;
};

/**
 * Repository for loan operations with optimized queries for
 * personal vs group contexts and creditor/debtor relationships
 */
export class LoanRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  /**
   * Format database loan record into response object
   */
  private formatLoanResponse(item: Record<string, any>): LoanResponse {
    return {
      ...item,
      loanDate: item.loanDate?.toISOString?.(),
      createdAt: item.createdAt?.toISOString?.(),
      updatedAt: item.updatedAt?.toISOString?.(),
    } as LoanResponse;
  }

  /**
   * Find all loans with pagination and optional filters
   * @deprecated Use more specific methods for better performance
   */
  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loan)
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map((item) => this.formatLoanResponse(item));
  }

  /**
   * Find loans with flexible filtering options
   * Main entry point for querying loans with proper optimization
   */
  async findLoans(
    filters: LoanFilters = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const {
      userId,
      groupId,
      isPersonal = groupId === undefined,
      asCreditor = true,
      asDebtor = true,
      limit = 10,
      offset = 0,
      sortOrder = "desc",
      sortField = "createdAt",
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

    // Handle role-specific views (creditor or debtor only)
    if (userId && asCreditor && !asDebtor) {
      return this.findLoansByCreditor(
        userId,
        { isPersonal, groupId, limit, offset },
        tx
      );
    }

    if (userId && !asCreditor && asDebtor) {
      return this.findLoansByDebtor(
        userId,
        { isPersonal, groupId, limit, offset },
        tx
      );
    }

    // Handle group-specific view
    if (groupId !== undefined) {
      return this.findLoansByGroup(
        groupId !== null ? groupId : 0,
        { userId, limit, offset },
        tx
      );
    }

    // Default case - use combined view for user
    if (userId) {
      return this.findAllLoansForUser(
        userId,
        { isPersonal, limit, offset },
        tx
      );
    }

    // Fallback for admin-level queries with no filters
    const result = await db
      .select()
      .from(loan)
      .orderBy(
        sortOrder === "asc" ? asc(loan[sortField]) : desc(loan[sortField])
      )
      .limit(limit)
      .offset(offset);

    // Enrich with debtor information
    const enrichedLoans = await Promise.all(
      result.map(async (item) => {
        const splits = await db
          .select()
          .from(loanSplit)
          .where(eq(loanSplit.loanId, item.id));

        if (splits.length === 1) {
          return this.formatLoanResponse({
            ...item,
            creditorId: item.createdBy,
            debtorId: splits[0].userId,
          });
        }

        return this.formatLoanResponse(item);
      })
    );

    return enrichedLoans;
  }

  /**
   * Find loans where the specified user is the creditor
   * Optimized query for retrieving loans given by a user
   */
  async findLoansByCreditor(
    userId: number,
    options: {
      isPersonal?: boolean;
      groupId?: number | null;
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const {
      isPersonal = true,
      groupId = null,
      limit = 10,
      offset = 0,
    } = options;

    const db = tx ?? this.db;

    // Build query conditionally based on context filters
    let query = db.select().from(loan);

    // Filter by creditor
    query = query.where(eq(loan.createdBy, userId));

    // Apply context filters
    if (groupId !== null && groupId !== undefined) {
      // Specific group
      query = query.where(eq(loan.groupId, groupId));
    } else if (isPersonal) {
      // Personal loans only (no group)
      query = query.where(isNull(loan.groupId));
    } else {
      // All group loans (any group)
      query = query.where(not(isNull(loan.groupId)));
    }

    const result = await query
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Add creditor info to each loan
    return Promise.all(
      result.map(async (item) => {
        // Get debtor info from loan splits
        const splits = await db
          .select()
          .from(loanSplit)
          .where(eq(loanSplit.loanId, item.id))
          .limit(1);

        return this.formatLoanResponse({
          ...item,
          creditorId: userId,
          debtorId: splits.length === 1 ? splits[0].userId : undefined,
        });
      })
    );
  }

  /**
   * Find loans where the specified user is the debtor
   * Optimized query for retrieving loans taken by a user
   */
  async findLoansByDebtor(
    userId: number,
    options: {
      isPersonal?: boolean;
      groupId?: number | null;
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const {
      isPersonal = true,
      groupId = null,
      limit = 10,
      offset = 0,
    } = options;

    const db = tx ?? this.db;

    // Use a more efficient join query
    let query = db
      .select({
        loan: loan,
        split: loanSplit,
      })
      .from(loan)
      .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
      .where(eq(loanSplit.userId, userId));

    // Apply context filters
    if (groupId !== null && groupId !== undefined) {
      // Specific group
      query = query.where(eq(loan.groupId, groupId));
    } else if (isPersonal) {
      // Personal loans only (no group)
      query = query.where(isNull(loan.groupId));
    } else {
      // All group loans (any group)
      query = query.where(not(isNull(loan.groupId)));
    }

    const result = await query
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform results to standard format with debtor info
    return result.map((row) => {
      return this.formatLoanResponse({
        ...row.loan,
        creditorId: row.loan.createdBy,
        debtorId: userId,
      });
    });
  }

  /**
   * Find all loans for a user, either as creditor or debtor
   * Efficient for personal dashboard views
   */
  async findAllLoansForUser(
    userId: number,
    options: {
      isPersonal?: boolean;
      groupId?: number | null;
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const {
      isPersonal = true,
      groupId = null,
      limit = 10,
      offset = 0,
    } = options;

    const db = tx ?? this.db;

    // First, get loans where user is creditor
    const loansAsCreditor = await this.findLoansByCreditor(
      userId,
      { isPersonal, groupId, limit: limit * 2, offset: 0 },
      tx
    );

    // Then, get loans where user is debtor
    const loansAsDebtor = await this.findLoansByDebtor(
      userId,
      { isPersonal, groupId, limit: limit * 2, offset: 0 },
      tx
    );

    // Combine and sort by creation date
    const allLoans = [...loansAsCreditor, ...loansAsDebtor]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(offset, offset + limit);

    return allLoans;
  }

  /**
   * Find loans by group with optimized query
   */
  async findLoansByGroup(
    groupId: number,
    options: {
      userId?: number | null;
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const { userId = null, limit = 10, offset = 0 } = options;

    const db = tx ?? this.db;

    // Start with base query for group loans
    let query = db.select().from(loan).where(eq(loan.groupId, groupId));

    // If userId provided, filter to show only loans where user is involved
    if (userId) {
      // User is either creditor or involved in a loan split
      query = query.where(
        or(
          eq(loan.createdBy, userId),
          sql`EXISTS (SELECT 1 FROM ${loanSplit} WHERE ${loanSplit.loanId} = ${loan.id} AND ${loanSplit.userId} = ${userId})`
        )
      );
    }

    const result = await query
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich with creditor and debtor information
    const enrichedLoans = await Promise.all(
      result.map(async (loanItem) => {
        const splits = await db
          .select()
          .from(loanSplit)
          .where(eq(loanSplit.loanId, loanItem.id));

        // For direct loans (only one debtor)
        if (splits.length === 1) {
          return this.formatLoanResponse({
            ...loanItem,
            creditorId: loanItem.createdBy,
            debtorId: splits[0].userId,
          });
        }

        // For loans with multiple debtors or no debtors (edge case)
        return this.formatLoanResponse({
          ...loanItem,
          creditorId: loanItem.createdBy,
        });
      })
    );

    return enrichedLoans;
  }

  /**
   * Find loans between specific users (friend-to-friend view)
   */
  async findLoansBetweenUsers(
    user1Id: number,
    user2Id: number,
    options: {
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const { limit = 10, offset = 0 } = options;

    const db = tx ?? this.db;

    // Get loans where user1 is creditor to user2
    const loans1to2 = await db
      .select({
        loan: loan,
        split: loanSplit,
      })
      .from(loan)
      .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
      .where(eq(loan.createdBy, user1Id))
      .where(eq(loanSplit.userId, user2Id))
      .where(isNull(loan.groupId));

    // Get loans where user2 is creditor to user1
    const loans2to1 = await db
      .select({
        loan: loan,
        split: loanSplit,
      })
      .from(loan)
      .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
      .where(eq(loan.createdBy, user2Id))
      .where(eq(loanSplit.userId, user1Id))
      .where(isNull(loan.groupId));

    // Combine and transform results
    const allLoans = [
      ...loans1to2.map((row) => ({
        ...row.loan,
        creditorId: user1Id,
        debtorId: user2Id,
      })),
      ...loans2to1.map((row) => ({
        ...row.loan,
        creditorId: user2Id,
        debtorId: user1Id,
      })),
    ]
      .sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(offset, offset + limit);

    return allLoans.map((loan) => this.formatLoanResponse(loan));
  }

  /**
   * Find a loan by its ID with enriched information
   */
  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;

    // Get the loan with a single query
    const result = await db.select().from(loan).where(eq(loan.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const loanItem = result[0]!;

    // Get the loan split to determine the debtor
    const splits = await db
      .select()
      .from(loanSplit)
      .where(eq(loanSplit.loanId, id));

    // Return enriched response with debtor info when available
    if (splits.length === 1) {
      return this.formatLoanResponse({
        ...loanItem,
        creditorId: loanItem.createdBy,
        debtorId: splits[0].userId,
      });
    }

    // Just return basic loan info
    return this.formatLoanResponse(loanItem);
  }

  /**
   * Create a new loan
   */
  async create(
    data: LoanCreate,
    tx?: DBTransactionType
  ): Promise<LoanResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      loanDate: data.loanDate ? new Date(data.loanDate) : undefined,
    };

    const result = await db.insert(loan).values(insertData).returning();

    if (result.length === 0) {
      throw new Error("Failed to create loan");
    }

    const item = result[0]!;
    return this.formatLoanResponse(item);
  }

  /**
   * Update an existing loan
   */
  async update(
    id: number,
    data: LoanUpdate,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      loanDate: data.loanDate ? new Date(data.loanDate) : undefined,
      updatedAt: new Date(),
    };

    await db.update(loan).set(updateData).where(eq(loan.id, id));

    return await this.findById(id, tx);
  }

  /**
   * Delete a loan
   */
  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(loan).where(eq(loan.id, id));

    return result.rowsAffected > 0;
  }

  /**
   * Count loans matching the specified criteria
   * Useful for pagination without fetching all records
   */
  async countLoans(
    filters: LoanFilters = {},
    tx?: DBTransactionType
  ): Promise<number> {
    const {
      userId,
      groupId,
      isPersonal = groupId === undefined,
      asCreditor = true,
      asDebtor = true,
      friendId,
    } = filters;

    const db = tx ?? this.db;

    // Special case: counting loans between friends
    if (userId && friendId) {
      // Count loans where either user is the creditor and the other is the debtor
      const result = await db
        .select({ value: count() })
        .from(loan)
        .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
        .where(
          or(
            and(eq(loan.createdBy, userId), eq(loanSplit.userId, friendId)),
            and(eq(loan.createdBy, friendId), eq(loanSplit.userId, userId))
          )
        )
        .where(isNull(loan.groupId));

      return result[0]?.value || 0;
    }

    // Special case: loans for a specific group
    if (groupId !== undefined) {
      let query = db
        .select({ value: count() })
        .from(loan)
        .where(eq(loan.groupId, groupId));

      // If a user is specified, filter to their involvement
      if (userId) {
        query = query.where(
          or(
            eq(loan.createdBy, userId),
            sql`EXISTS (SELECT 1 FROM ${loanSplit} WHERE ${loanSplit.loanId} = ${loan.id} AND ${loanSplit.userId} = ${userId})`
          )
        );
      }

      const result = await query;
      return result[0]?.value || 0;
    }

    // Count based on role (creditor, debtor, or both)
    if (userId) {
      // Count as creditor
      const creditorCountPromise = asCreditor
        ? db
            .select({ value: count() })
            .from(loan)
            .where(eq(loan.createdBy, userId))
            .where(
              isPersonal ? isNull(loan.groupId) : not(isNull(loan.groupId))
            )
            .then((result) => result[0]?.value || 0)
        : Promise.resolve(0);

      // Count as debtor
      const debtorCountPromise = asDebtor
        ? db
            .select({ value: count() })
            .from(loan)
            .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
            .where(eq(loanSplit.userId, userId))
            .where(
              isPersonal ? isNull(loan.groupId) : not(isNull(loan.groupId))
            )
            .then((result) => result[0]?.value || 0)
        : Promise.resolve(0);

      // Combine counts, but need to account for potential overlap
      if (asCreditor && asDebtor) {
        // Need to get total unique loans where user is involved
        const totalCountPromise = db
          .select({ value: count() })
          .from(loan)
          .where(
            or(
              eq(loan.createdBy, userId),
              sql`EXISTS (SELECT 1 FROM ${loanSplit} WHERE ${loanSplit.loanId} = ${loan.id} AND ${loanSplit.userId} = ${userId})`
            )
          )
          .where(isPersonal ? isNull(loan.groupId) : not(isNull(loan.groupId)))
          .then((result) => result[0]?.value || 0);

        return totalCountPromise;
      } else {
        // Just add the counts since we're only looking at one role
        const [creditorCount, debtorCount] = await Promise.all([
          creditorCountPromise,
          debtorCountPromise,
        ]);
        return creditorCount + debtorCount;
      }
    }

    // Default case - count all loans matching context filter
    const result = await db
      .select({ value: count() })
      .from(loan)
      .where(isPersonal ? isNull(loan.groupId) : not(isNull(loan.groupId)));

    return result[0]?.value || 0;
  }
}
