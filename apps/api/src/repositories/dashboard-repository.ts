import { type DBType, type DBTransactionType } from "@/db";
import {
  budget,
  transaction,
  transactionEntry,
  transactionAccount,
  recurring,
} from "@/db";
import { sql, eq, and, gte, lte, inArray } from "drizzle-orm";
import { ACCOUNT_TYPE } from "@/db/constants";

export class DashboardRepository {
  private readonly db: DBType;

  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

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

  async getTopExpenseCategory(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<{ name: string; amount: number; percentage: number } | null> {
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

    const topCategory = categorySpending[0];
    if (!topCategory) {
      return null;
    }

    const percentage = (topCategory.totalAmount / totalExpenses) * 100;

    return {
      name: topCategory.categoryName,
      amount: topCategory.totalAmount,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
    };
  }

  async getSpendingAnalytics(
    userId: number,
    startDate: Date,
    endDate: Date,
    tx?: DBTransactionType
  ): Promise<{
    totalSpending: number;
    categories: Array<{
      categoryId: number;
      categoryName: string;
      amount: number;
      percentage: number;
      transactionCount: number;
      trend: "up" | "down" | "stable";
    }>;
    analytics: {
      numberOfCategories: number;
      averageSpendingPerCategory: number;
      minSpending: number;
      maxSpending: number;
      totalTransactions: number;
      sumOfPercentages: number;
      standardDeviation: number;
    };
  } | null> {
    const db = tx ?? this.db;
    // Get total spending
    const totalSpending = await this.getMonthlyExpenses(
      userId,
      startDate,
      endDate,
      tx
    );

    if (totalSpending === 0) {
      return null; // No spending data
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
      return null;
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

    // Calculate analytics
    const amounts = categories.map((c) => c.amount);
    const numberOfCategories = categories.length;
    const totalTransactions = categories.reduce(
      (sum, c) => sum + c.transactionCount,
      0
    );
    const sumOfPercentages = categories.reduce(
      (sum, c) => sum + c.percentage,
      0
    );
    const averageSpendingPerCategory = totalSpending / numberOfCategories;
    const minSpending = Math.min(...amounts);
    const maxSpending = Math.max(...amounts);

    // Calculate standard deviation
    const mean = averageSpendingPerCategory;
    const squaredDiffs = amounts.map((amount) => Math.pow(amount - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      totalSpending,
      categories,
      analytics: {
        numberOfCategories,
        averageSpendingPerCategory:
          Math.round(averageSpendingPerCategory * 100) / 100,
        minSpending,
        maxSpending,
        totalTransactions,
        sumOfPercentages: Math.round(sumOfPercentages * 10) / 10,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
      },
    };
  }

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

  async getUpcomingBills(
    userId: number,
    daysAhead: number = 30,
    tx?: DBTransactionType
  ): Promise<
    Array<{
      id: number;
      description: string;
      amount: number;
      dueDate: string;
      daysUntilDue: number;
      category: string;
      priority: "high" | "medium" | "low";
    }>
  > {
    const db = tx ?? this.db;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    // Get recurring items due within the specified days
    const upcomingRecurring = await db
      .select({
        id: recurring.id,
        description: recurring.description,
        amount: recurring.amount,
        nextDate: recurring.nextDate,
        targetAccountName: transactionAccount.name,
      })
      .from(recurring)
      .innerJoin(
        transactionAccount,
        eq(recurring.targetTransactionAccountID, transactionAccount.id)
      )
      .where(
        and(
          eq(recurring.userId, userId),
          gte(recurring.nextDate, now),
          lte(recurring.nextDate, futureDate)
        )
      )
      .orderBy(recurring.nextDate);

    // Process the results
    const upcomingBills = upcomingRecurring.map((item) => {
      const dueDate = new Date(item.nextDate);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine priority based on days until due and amount
      let priority: "high" | "medium" | "low";
      if (daysUntilDue <= 3 || item.amount > 500) {
        priority = "high";
      } else if (daysUntilDue <= 7 || item.amount > 100) {
        priority = "medium";
      } else {
        priority = "low";
      }

      return {
        id: item.id,
        description: item.description,
        amount: item.amount,
        dueDate: dueDate.toISOString(),
        daysUntilDue,
        category: item.targetAccountName,
        priority,
      };
    });

    return upcomingBills;
  }

  async getNetWorthTrend(
    userId: number,
    months: number = 12,
    tx?: DBTransactionType
  ): Promise<
    Array<{
      date: string;
      netWorth: number;
      assets: number;
      liabilities: number;
      change: number;
      changePercentage: number;
    }>
  > {
    const db = tx ?? this.db;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1); // Include current month

    const trendData: Array<{
      date: string;
      netWorth: number;
      assets: number;
      liabilities: number;
      change: number;
      changePercentage: number;
    }> = [];

    // Calculate net worth for each month
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(startDate.getMonth() + i);
      monthStart.setDate(1); // First day of month

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month

      // Calculate assets: INCOME + LOAN_GIVEN + SAVING accounts
      const assetsResult = await db
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
            sql`${transactionAccount.type} IN ('INCOME', 'LOAN_GIVEN', 'SAVING')`,
            gte(transaction.transactionDate, monthStart),
            lte(transaction.transactionDate, monthEnd),
            sql`${transactionEntry.amount} > 0`
          )
        );

      // Calculate liabilities: LOAN_TAKEN accounts
      const liabilitiesResult = await db
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
            gte(transaction.transactionDate, monthStart),
            lte(transaction.transactionDate, monthEnd),
            sql`${transactionEntry.amount} > 0`
          )
        );

      const assets = assetsResult[0]?.total || 0;
      const liabilities = liabilitiesResult[0]?.total || 0;
      const netWorth = assets - liabilities;

      // Calculate change from previous month
      const previousMonthData = trendData[trendData.length - 1];
      const change = previousMonthData
        ? netWorth - previousMonthData.netWorth
        : 0;
      const changePercentage =
        previousMonthData && previousMonthData.netWorth !== 0
          ? (change / previousMonthData.netWorth) * 100
          : 0;

      trendData.push({
        date: monthEnd.toISOString().split("T")[0] || monthEnd.toISOString(), // YYYY-MM-DD format
        netWorth,
        assets,
        liabilities,
        change,
        changePercentage: Math.round(changePercentage * 100) / 100, // Round to 2 decimal places
      });
    }

    return trendData;
  }
}
