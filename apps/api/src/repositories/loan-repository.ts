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

// Define types for database query results
type LoanRecord = typeof loan.$inferSelect;
type LoanSplitRecord = typeof loanSplit.$inferSelect;

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
      // Handle potentially undefined dates with optional chaining
      loanDate:
        item.loanDate instanceof Date
          ? item.loanDate.toISOString()
          : item.loanDate,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : item.createdAt,
      updatedAt:
        item.updatedAt instanceof Date
          ? item.updatedAt.toISOString()
          : item.updatedAt,
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

    if (userId && asDebtor && !asCreditor) {
      return this.findLoansByDebtor(
        userId,
        { isPersonal, groupId, limit, offset },
        tx
      );
    }

    // For full/combined view, need a more complex approach to efficiently fetch all data
    const loanItems = await this.findLoansWithRoles(
      {
        userId,
        groupId,
        isPersonal,
        asCreditor,
        asDebtor,
        limit,
        offset,
        sortOrder,
        sortField,
      },
      tx
    );

    const enrichedLoans = await Promise.all(
      loanItems.map(async (item) => {
        // Get splits associated with this loan
        const splits = await db
          .select()
          .from(loanSplit)
          .where(eq(loanSplit.loanId, item.id));

        // Decorate with creditor/debtor info when available
        if (splits.length === 1) {
          return this.formatLoanResponse({
            ...item,
            creditorId: item.createdBy,
            debtorId: splits[0]?.userId,
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

    // Build query with filter conditions
    let conditions = [eq(loan.createdBy, userId)];

    // Apply context filters
    if (groupId !== null && groupId !== undefined) {
      // Specific group
      conditions.push(eq(loan.groupId, groupId as number));
    } else if (isPersonal) {
      // Personal loans only (no group)
      conditions.push(isNull(loan.groupId));
    } else {
      // All group loans (any group)
      conditions.push(not(isNull(loan.groupId)));
    }

    const result = await db
      .select()
      .from(loan)
      .where(and(...conditions))
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
          debtorId: splits.length > 0 ? splits[0]?.userId : undefined,
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

    // First get the loans where user is a participant (split)
    const loanIds = await db
      .select({ id: loanSplit.loanId })
      .from(loanSplit)
      .where(eq(loanSplit.userId, userId));

    if (loanIds.length === 0) {
      return [];
    }

    // Create IN condition for loan IDs
    const loanIdConditions = loanIds.map(({ id }) => eq(loan.id, id));

    // Build conditions
    let conditions = [or(...loanIdConditions)];

    // Apply context filters
    if (groupId !== null && groupId !== undefined) {
      conditions.push(eq(loan.groupId, groupId as number));
    } else if (isPersonal) {
      conditions.push(isNull(loan.groupId));
    } else {
      conditions.push(not(isNull(loan.groupId)));
    }

    const result = await db
      .select()
      .from(loan)
      .where(and(...conditions))
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Format the result with creditor/debtor info
    return result.map((item) => {
      return this.formatLoanResponse({
        ...item,
        creditorId: item.createdBy,
        debtorId: userId,
      });
    });
  }

  /**
   * Find loans between two users in either direction
   * Optimized for friend-to-friend loan retrieval
   */
  async findLoansBetweenUsers(
    user1Id: number,
    user2Id: number,
    options: { limit?: number; offset?: number } = {},
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const { limit = 10, offset = 0 } = options;
    const db = tx ?? this.db;

    // Find loans where user1 is creditor and user2 is debtor
    const user1AsCreditorResults = await db
      .select({
        loan: loan,
        loan_split: loanSplit,
      })
      .from(loan)
      .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
      .where(and(eq(loan.createdBy, user1Id), eq(loanSplit.userId, user2Id)))
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Find loans where user2 is creditor and user1 is debtor
    const user2AsCreditorResults = await db
      .select({
        loan: loan,
        loan_split: loanSplit,
      })
      .from(loan)
      .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
      .where(and(eq(loan.createdBy, user2Id), eq(loanSplit.userId, user1Id)))
      .orderBy(desc(loan.createdAt))
      .limit(limit)
      .offset(offset);

    // Combine and format results
    const combinedResults = [
      ...user1AsCreditorResults,
      ...user2AsCreditorResults,
    ]
      .sort((a, b) => {
        // Sort by createdAt DESC
        const dateA = new Date(a.loan.createdAt);
        const dateB = new Date(b.loan.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);

    return combinedResults.map((row) => {
      const creditorId = row.loan.createdBy;
      const debtorId = row.loan_split?.userId;
      return this.formatLoanResponse({
        ...row.loan,
        creditorId,
        debtorId,
      });
    });
  }

  /**
   * Find loans with role-specific filters
   * Helper for combining creditor and debtor views
   */
  private async findLoansWithRoles(
    filters: LoanFilters,
    tx?: DBTransactionType
  ): Promise<LoanRecord[]> {
    const {
      userId,
      groupId,
      isPersonal = true,
      asCreditor = true,
      asDebtor = true,
      limit = 10,
      offset = 0,
      sortOrder = "desc",
    } = filters;

    const db = tx ?? this.db;

    // Specific to group view
    if (groupId !== undefined && groupId !== null) {
      let conditions = [eq(loan.groupId, groupId as number)];

      // If userId provided, filter to show only loans where user is involved
      if (userId) {
        const userCondition = or(
          eq(loan.createdBy, userId),
          sql`EXISTS (SELECT 1 FROM ${loanSplit} WHERE ${loanSplit.loanId} = ${loan.id} AND ${loanSplit.userId} = ${userId})`
        );
        if (userCondition) {
          conditions.push(userCondition);
        }
      }

      const result = await db
        .select()
        .from(loan)
        .where(and(...conditions))
        .orderBy(
          sortOrder === "asc" ? asc(loan.createdAt) : desc(loan.createdAt)
        )
        .limit(limit)
        .offset(offset);

      return result;
    }

    // Standard personal loans view
    if (userId) {
      // Prepare context condition
      const contextCondition = isPersonal
        ? isNull(loan.groupId)
        : not(isNull(loan.groupId));

      if (asCreditor && asDebtor) {
        // Combine queries for both roles
        const asCreditorResults = await db
          .select()
          .from(loan)
          .where(and(eq(loan.createdBy, userId), contextCondition));

        const asDebtorResults = await db
          .select({
            loan: loan,
          })
          .from(loan)
          .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
          .where(and(eq(loanSplit.userId, userId), contextCondition))
          .orderBy(
            sortOrder === "asc" ? asc(loan.createdAt) : desc(loan.createdAt)
          )
          .limit(limit)
          .offset(offset);

        // Combine results manually
        const debtorLoans = asDebtorResults.map((row) => row.loan);

        // Merge, sort, limit
        return [...asCreditorResults, ...debtorLoans]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === "asc"
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          })
          .slice(0, limit);
      } else if (asCreditor) {
        // Just creditor role
        return await db
          .select()
          .from(loan)
          .where(and(eq(loan.createdBy, userId), contextCondition))
          .orderBy(
            sortOrder === "asc" ? asc(loan.createdAt) : desc(loan.createdAt)
          )
          .limit(limit)
          .offset(offset);
      } else if (asDebtor) {
        // Just debtor role
        const loanIds = await db
          .select({ id: loanSplit.loanId })
          .from(loanSplit)
          .where(eq(loanSplit.userId, userId));

        if (loanIds.length === 0) {
          return [];
        }

        const loanIdConditions = loanIds.map(({ id }) => eq(loan.id, id));

        return await db
          .select()
          .from(loan)
          .where(and(or(...loanIdConditions), contextCondition))
          .orderBy(
            sortOrder === "asc" ? asc(loan.createdAt) : desc(loan.createdAt)
          )
          .limit(limit)
          .offset(offset);
      } else {
        return []; // No roles specified
      }
    }

    // Default fallback for all loans
    return await db
      .select()
      .from(loan)
      .orderBy(sortOrder === "asc" ? asc(loan.createdAt) : desc(loan.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Find loan by id
   */
  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;
    const result = await db.select().from(loan).where(eq(loan.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    const item = result[0];
    if (!item) return null;

    // Get splits to determine debtor
    const splits = await db
      .select()
      .from(loanSplit)
      .where(eq(loanSplit.loanId, item.id));

    return this.formatLoanResponse({
      ...item,
      creditorId: item.createdBy,
      debtorId: splits.length === 1 ? splits[0]?.userId : undefined,
    });
  }

  /**
   * Find loan with splits
   */
  async findByIdWithSplits(
    id: number,
    tx?: DBTransactionType
  ): Promise<{ loan: LoanResponse; splits: any[] } | null> {
    const loanItem = await this.findById(id, tx);
    if (!loanItem) return null;

    const db = tx ?? this.db;
    const splits = await db
      .select()
      .from(loanSplit)
      .where(eq(loanSplit.loanId, loanItem.id));

    return {
      loan: loanItem,
      splits,
    };
  }

  /**
   * Create a loan and return the created loan with ID
   */
  async create(
    data: LoanCreate,
    tx?: DBTransactionType
  ): Promise<LoanResponse> {
    const db = tx ?? this.db;

    // Process data to handle date conversion
    const insertData = {
      ...data,
      // Convert string dates to Date objects for db insertion if needed
      loanDate: data.loanDate ? new Date(data.loanDate) : new Date(),
    };

    // Insert loan
    const result = await db.insert(loan).values(insertData).returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create loan");
    }

    const createdLoan = result[0];
    if (!createdLoan) {
      throw new Error("Failed to retrieve created loan");
    }

    return this.formatLoanResponse(createdLoan);
  }

  /**
   * Create splits for a loan
   */
  async createSplits(
    loanId: number,
    splits: { userId: number; amountOwed: number }[],
    tx?: DBTransactionType
  ) {
    const db = tx ?? this.db;
    const values = splits.map(({ userId, amountOwed }) => ({
      loanId,
      userId,
      amountOwed,
    }));

    return db.insert(loanSplit).values(values).returning();
  }

  /**
   * Update a loan
   */
  async update(
    id: number,
    data: LoanUpdate,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;

    // Process data to handle date conversion
    const updateData: Record<string, any> = { ...data };

    // Convert string dates to Date objects for db update
    if (typeof data.loanDate === "string") {
      updateData.loanDate = new Date(data.loanDate);
    }

    const result = await db
      .update(loan)
      .set(updateData)
      .where(eq(loan.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    const updatedLoan = result[0];
    if (!updatedLoan) return null;

    return this.formatLoanResponse(updatedLoan);
  }

  /**
   * Delete a loan
   */
  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;

    // Delete associated splits first
    await db.delete(loanSplit).where(eq(loanSplit.loanId, id));

    // Then delete the loan
    const result = await db.delete(loan).where(eq(loan.id, id)).returning();

    return result.length > 0;
  }

  /**
   * Count loans based on filters
   */
  async count(
    filters: LoanFilters = {},
    tx?: DBTransactionType
  ): Promise<number> {
    const {
      userId,
      groupId,
      isPersonal = true,
      asCreditor = true,
      asDebtor = true,
    } = filters;

    const db = tx ?? this.db;

    // Special case: count between two users
    if (userId && filters.friendId) {
      const user1Id = userId;
      const user2Id = filters.friendId;

      // Count loans where user1 is creditor and user2 is debtor
      const asCreditorResult = await db
        .select({ value: count() })
        .from(loan)
        .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
        .where(and(eq(loan.createdBy, user1Id), eq(loanSplit.userId, user2Id)));

      // Count loans where user2 is creditor and user1 is debtor
      const asDebtorResult = await db
        .select({ value: count() })
        .from(loan)
        .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
        .where(and(eq(loan.createdBy, user2Id), eq(loanSplit.userId, user1Id)));

      return (
        Number(asCreditorResult[0]?.value || 0) +
        Number(asDebtorResult[0]?.value || 0)
      );
    }

    // Special case: loans for a specific group
    if (groupId !== undefined && groupId !== null) {
      const groupCondition = eq(loan.groupId, groupId as number);

      // If a user is specified, filter to their involvement
      if (userId) {
        const userCondition = or(
          eq(loan.createdBy, userId),
          sql`EXISTS (SELECT 1 FROM ${loanSplit} WHERE ${loanSplit.loanId} = ${loan.id} AND ${loanSplit.userId} = ${userId})`
        );

        const result = await db
          .select({ value: count() })
          .from(loan)
          .where(and(groupCondition, userCondition));

        return Number(result[0]?.value || 0);
      } else {
        const result = await db
          .select({ value: count() })
          .from(loan)
          .where(groupCondition);

        return Number(result[0]?.value || 0);
      }
    }

    // Count based on role (creditor, debtor, or both)
    if (userId) {
      const contextCondition = isPersonal
        ? isNull(loan.groupId)
        : not(isNull(loan.groupId));

      // Count as creditor
      const creditorCountPromise = asCreditor
        ? db
            .select({ value: count() })
            .from(loan)
            .where(and(eq(loan.createdBy, userId), contextCondition))
            .then((result) => Number(result[0]?.value || 0))
        : Promise.resolve(0);

      // Count as debtor
      const debtorCountPromise = asDebtor
        ? db
            .select({ value: count() })
            .from(loan)
            .innerJoin(loanSplit, eq(loan.id, loanSplit.loanId))
            .where(and(eq(loanSplit.userId, userId), contextCondition))
            .then((result) => Number(result[0]?.value || 0))
        : Promise.resolve(0);

      const [creditorCount, debtorCount] = await Promise.all([
        creditorCountPromise,
        debtorCountPromise,
      ]);

      return creditorCount + debtorCount;
    }

    // Count all loans
    const result = await db.select({ value: count() }).from(loan);
    return Number(result[0]?.value || 0);
  }
}
