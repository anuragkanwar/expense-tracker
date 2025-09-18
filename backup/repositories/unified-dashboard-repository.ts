import { type DBType, type DBTransactionType } from "@/db";
import {
  budget,
  transaction,
  transactionEntry,
  transactionAccount,
  expenseShare,
} from "@/db";
import { sql, eq, and, gte, lte, inArray, not } from "drizzle-orm";
import { ACCOUNT_TYPE } from "@/db/constants";
import { EXPENSE_SHARE_TYPE } from "@/db";

export class UnifiedDashboardRepository {
  private readonly db: DBType;

  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  /**
   * Gets the total for loans given by the user in the specified date range.
   * Uses the unified expense_share table with type = LOAN and payerUserId = userId.
   */
  async getMonthlyLoanGiven(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;

    // Using the transaction entries approach (from original repository)
    const transactionResult = await db
      .select({ total: sql<number>`SUM(${transactionEntry.amount})` })
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.LOAN_GIVEN),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate)
          // No sign filter - we need NET SUM (all entries) for loan accounts
        )
      );

    return Math.abs(transactionResult[0]?.total || 0);
  }

  /**
   * Gets the total loans given by querying the unified expense_share table directly.
   * This provides an alternative approach based on the unified schema.
   */
  async getMonthlyLoanGivenFromUnifiedSchema(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;

    const result = await db
      .select({
        total: sql<number>`SUM(${expenseShare.amount})`,
      })
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
          eq(expenseShare.payerUserId, userId), // User is the creditor/lender
          not(eq(expenseShare.isPayerShare, 1)), // Exclude payer's own shares
          gte(expenseShare.realizedAt || expenseShare.loanDate, startDate),
          lte(expenseShare.realizedAt || expenseShare.loanDate, endDate)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Gets the total for loans taken by the user in the specified date range.
   * Uses the transaction entries approach (from original repository).
   */
  async getMonthlyLoanTaken(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;
    const result = await db
      .select({ total: sql<number>`SUM(${transactionEntry.amount})` })
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.LOAN_TAKEN),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate)
          // No sign filter - we need NET SUM (all entries) for loan accounts
        )
      );

    return Math.abs(result[0]?.total || 0);
  }

  /**
   * Gets the total loans taken by querying the unified expense_share table directly.
   * This provides an alternative approach based on the unified schema.
   */
  async getMonthlyLoanTakenFromUnifiedSchema(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;

    const result = await db
      .select({
        total: sql<number>`SUM(${expenseShare.amount})`,
      })
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
          eq(expenseShare.participantUserId, userId), // User is the debtor/borrower
          not(eq(expenseShare.isPayerShare, 1)), // Exclude payer's own shares
          gte(expenseShare.realizedAt || expenseShare.loanDate, startDate),
          lte(expenseShare.realizedAt || expenseShare.loanDate, endDate)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Gets the total expenses for the user in the specified date range.
   * Identical to original implementation as expenses are not affected by the schema unification.
   */
  async getMonthlyExpenses(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;
    const result = await db
      .select({ total: sql<number>`SUM(${transactionEntry.amount})` })
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate),
          sql`${transactionEntry.amount} > 0` // Only positive amounts (money received by expense accounts)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Gets the total income for the user in the specified date range.
   * Identical to original implementation as income is not affected by the schema unification.
   */
  async getMonthlyIncome(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;
    const result = await db
      .select({ total: sql<number>`SUM(${transactionEntry.amount})` })
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.INCOME),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate),
          sql`${transactionEntry.amount} > 0` // Only positive amounts (money received by income accounts)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Gets the total obligations by type (expense shares or loans) for a given user.
   * This is a new method specific to the unified schema.
   */
  async getTotalObligationsByType(
    userId: number,
    type: EXPENSE_SHARE_TYPE,
    asCreditor: boolean = true,
    asDebtor: boolean = true,
    startDate?: Date,
    endDate?: Date,
    tx?: DBTransactionType
  ): Promise<{
    given: number;
    taken: number;
    net: number;
  }> {
    const db = tx ?? this.db;

    // Build base conditions
    const baseConditions = [eq(expenseShare.type, type)];

    // Add date filters if provided
    if (startDate) {
      baseConditions.push(
        gte(expenseShare.realizedAt || expenseShare.loanDate, startDate)
      );
    }

    if (endDate) {
      baseConditions.push(
        lte(expenseShare.realizedAt || expenseShare.loanDate, endDate)
      );
    }

    // Amount given to others (user as creditor/payer)
    let givenAmount = 0;
    if (asCreditor) {
      const givenResult = await db
        .select({
          total: sql<number>`SUM(${expenseShare.amount} - ${expenseShare.paidAmount})`,
        })
        .from(expenseShare)
        .where(
          and(
            ...baseConditions,
            eq(expenseShare.payerUserId, userId),
            not(eq(expenseShare.participantUserId, userId)), // Exclude self-loans
            not(eq(expenseShare.isPayerShare, 1)) // Exclude payer's own shares
          )
        );

      givenAmount = givenResult[0]?.total || 0;
    }

    // Amount taken from others (user as debtor/participant)
    let takenAmount = 0;
    if (asDebtor) {
      const takenResult = await db
        .select({
          total: sql<number>`SUM(${expenseShare.amount} - ${expenseShare.paidAmount})`,
        })
        .from(expenseShare)
        .where(
          and(
            ...baseConditions,
            eq(expenseShare.participantUserId, userId),
            not(eq(expenseShare.payerUserId, userId)), // Exclude self-loans
            not(eq(expenseShare.isPayerShare, 1)) // Exclude payer's own shares
          )
        );

      takenAmount = takenResult[0]?.total || 0;
    }

    return {
      given: givenAmount,
      taken: takenAmount,
      net: givenAmount - takenAmount,
    };
  }

  /**
   * Calculates the budget utilization percentage.
   * Identical to original implementation as budgets are not affected by the schema unification.
   */
  async getBudgetUtilization(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<number> {
    const db = tx ?? this.db;
    // Get budgets linked to EXPENSE type accounts
    const budgetData = await db
      .select({
        budgetAmount: budget.amount,
        accountId: budget.transactionAccountId,
      })
      .from(budget)
      .innerJoin(
        transactionAccount,
        eq(budget.transactionAccountId, transactionAccount.id)
      )
      .where(
        and(
          eq(budget.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE)
        )
      );

    const totalBudget = budgetData.reduce((sum, b) => sum + b.budgetAmount, 0);

    // Calculate total expenses for the same accounts that have budgets
    if (budgetData.length === 0) {
      return 0; // No budgets set
    }

    const accountIds = budgetData.map((b) => b.accountId);
    const expenseResult = await db
      .select({ total: sql<number>`SUM(${transactionEntry.amount})` })
      .from(transactionEntry)
      .innerJoin(
        transaction,
        eq(transactionEntry.transactionId, transaction.id)
      )
      .where(
        and(
          eq(transaction.userId, userId),
          inArray(transactionEntry.transactionAccountId, accountIds),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate),
          sql`${transactionEntry.amount} > 0`
        )
      );

    const totalExpenses = expenseResult[0]?.total || 0;

    return totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  }

  /**
   * Gets the top expense category for the user.
   * Identical to original implementation as expense categories are not affected by the schema unification.
   */
  async getTopExpenseCategory(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<{ name: string; amount: number; percentage: number } | null> {
    // Using the original implementation since expense categories are not affected by schema unification
    const db = tx ?? this.db;
    // Get total expenses for percentage calculation
    const totalExpenses = await this.getMonthlyExpenses(
      userId,
      startDate,
      endDate,
      tx
    );

    if (totalExpenses === 0) {
      return null; // No expenses to analyze
    }

    // Get spending by category (grouped by transaction account name)
    const categorySpending = await db
      .select({
        categoryName: transactionAccount.name,
        totalAmount: sql<number>`SUM(${transactionEntry.amount})`,
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate),
          sql`${transactionEntry.amount} > 0`
        )
      )
      .groupBy(transactionAccount.name)
      .orderBy(sql`SUM(${transactionEntry.amount}) DESC`)
      .limit(1);

    if (categorySpending.length === 0) {
      return null;
    }

    // If we got here, categorySpending has at least one item (already checked length above)
    const topCategory = categorySpending[0]!;

    const percentage = (topCategory.totalAmount / totalExpenses) * 100;

    return {
      name: topCategory.categoryName,
      amount: topCategory.totalAmount,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
    };
  }

  /**
   * Gets spending breakdown by category for the user in the specified date range.
   * Includes amount, percentage of total, transaction count, and trend for each category.
   * This is identical to the implementation in DashboardRepository since expense categories
   * are not affected by schema unification.
   */
  async getSpendingByCategory(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<
    Array<{
      categoryId: number;
      categoryName: string;
      amount: number;
      percentage: number;
      transactionCount: number;
      trend: "up" | "down" | "stable";
    }>
  > {
    const db = tx ?? this.db;
    // Get total spending for percentage calculation
    const totalSpending = await this.getMonthlyExpenses(
      userId,
      startDate,
      endDate,
      tx
    );

    if (totalSpending === 0) {
      return [];
    }

    // Get spending by category with transaction counts
    const categoryData = await db
      .select({
        categoryId: transactionAccount.id,
        categoryName: transactionAccount.name,
        totalAmount: sql<number>`SUM(${transactionEntry.amount})`,
        transactionCount: sql<number>`COUNT(${transactionEntry.id})`,
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE),
          gte(transaction.transactionDate, startDate),
          lte(transaction.transactionDate, endDate),
          sql`${transactionEntry.amount} > 0`
        )
      )
      .groupBy(transactionAccount.id, transactionAccount.name)
      .orderBy(sql`SUM(${transactionEntry.amount}) DESC`);

    if (categoryData.length === 0) {
      return [];
    }

    // Calculate previous month dates for trend comparison
    const prevMonthStart = new Date(startDate);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(endDate);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);

    // Get previous month spending by category
    const prevMonthData = await db
      .select({
        categoryId: transactionAccount.id,
        totalAmount: sql<number>`SUM(${transactionEntry.amount})`,
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
        and(
          eq(transaction.userId, userId),
          eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE),
          gte(transaction.transactionDate, prevMonthStart),
          lte(transaction.transactionDate, prevMonthEnd),
          sql`${transactionEntry.amount} > 0`
        )
      )
      .groupBy(transactionAccount.id);

    // Create a map for quick lookup of previous month data
    const prevMonthMap = new Map<number, number>();
    prevMonthData.forEach((item) => {
      prevMonthMap.set(item.categoryId, item.totalAmount);
    });

    // Build categories array with trends
    const categories = categoryData.map((category) => {
      const percentage = (category.totalAmount / totalSpending) * 100;
      const prevAmount = prevMonthMap.get(category.categoryId) || 0;

      let trend: "up" | "down" | "stable";
      if (prevAmount === 0) {
        trend = "stable"; // No previous data
      } else if (category.totalAmount > prevAmount) {
        trend = "up";
      } else if (category.totalAmount < prevAmount) {
        trend = "down";
      } else {
        trend = "stable";
      }

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        amount: category.totalAmount,
        percentage: Math.round(percentage * 10) / 10,
        transactionCount: category.transactionCount,
        trend,
      };
    });

    return categories;
  }
}
