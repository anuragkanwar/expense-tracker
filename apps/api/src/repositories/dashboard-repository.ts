import { db as DATABASE } from "@pocket-pixie/db";
// import {
//   transactionEntry,
//   transactionAccount,
//   recurring,
//   budget,
// } from "@pocket-pixie/db";
// import { eq, and, gte, lte, desc, sum, count } from "drizzle-orm";
// import { TXN_TYPE, RECURRENCE_TYPE, TIME_PERIOD } from "@pocket-pixie/db";
import { TransactionAccountRepository } from "./transaction-account-repository";

export class DashboardRepository {
  private readonly db: typeof DATABASE;
  private readonly transactionAccountRepository: TransactionAccountRepository;

  constructor({
    db,
    transactionAccountRepository,
  }: {
    db: typeof DATABASE;
    transactionAccountRepository: TransactionAccountRepository;
  }) {
    this.db = db;
    this.transactionAccountRepository = transactionAccountRepository;
  }
  //
  // async getMonthlySummary(userId: number, month: Date) {
  //   const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  //   const endOfMonth = new Date(
  //     month.getFullYear(),
  //     month.getMonth() + 1,
  //     0,
  //     23,
  //     59,
  //     59
  //   );
  //
  //   // Get main account for the user
  //   const mainAccount =
  //     await this.transactionAccountRepository.findMainAccountByUser(userId);
  //
  //   if (!mainAccount) {
  //     return {
  //       totalIncome: 0,
  //       totalExpenses: 0,
  //       netIncome: 0,
  //       budgetUtilization: 0,
  //       savingsRate: 0,
  //       topExpenseCategory: {
  //         name: "No expenses",
  //         amount: 0,
  //         percentage: 0,
  //       },
  //     };
  //   }
  //
  //   const mainAccountId = mainAccount.id;
  //
  //   // Get total income: positive amounts in main account for INCOME type
  //   const incomeResult = await this.db
  //     .select({
  //       total: sum(transactionEntry.amount),
  //     })
  //     .from(transactionEntry)
  //     .where(
  //       and(
  //         eq(transactionEntry.transactionAccountId, mainAccountId),
  //         eq(transactionEntry.type, TXN_TYPE.INCOME),
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     );
  //
  //   // Get total expenses: negative amounts in main account for EXPENSE type
  //   const expenseResult = await this.db
  //     .select({
  //       total: sum(transactionEntry.amount),
  //     })
  //     .from(transactionEntry)
  //     .where(
  //       and(
  //         eq(transactionEntry.transactionAccountId, mainAccountId),
  //         eq(transactionEntry.type, TXN_TYPE.EXPENSE),
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     );
  //
  //   const income = Number((incomeResult[0] && incomeResult[0].total) || 0);
  //   const expenses = Math.abs(
  //     Number((expenseResult[0] && expenseResult[0].total) || 0)
  //   ); // Expenses are stored as negative, so take absolute value
  //
  //   // Get budget utilization
  //   const budgetUtilization = await this.getBudgetUtilization(userId, month);
  //
  //   // Get top expense category
  //   const topCategory = await this.getTopExpenseCategory(userId, month);
  //
  //   return {
  //     totalIncome: income,
  //     totalExpenses: expenses,
  //     netIncome: income - expenses,
  //     budgetUtilization,
  //     savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
  //     topExpenseCategory: topCategory,
  //   };
  // }
  //
  // async getSpendingByCategory(userId: number, month: Date) {
  //   const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  //   const endOfMonth = new Date(
  //     month.getFullYear(),
  //     month.getMonth() + 1,
  //     0,
  //     23,
  //     59,
  //     59
  //   );
  //
  //   // Get main account to exclude it from category spending
  //   const mainAccount =
  //     await this.transactionAccountRepository.findMainAccountByUser(userId);
  //   if (!mainAccount) {
  //     return [];
  //   }
  //
  //   // Get spending by category: positive amounts in non-main accounts for EXPENSE type
  //   const categorySpending = await this.db
  //     .select({
  //       categoryId: transactionCategory.id,
  //       categoryName: transactionCategory.name,
  //       amount: sum(transactionEntry.amount),
  //       transactionCount: count(transactionEntry.id),
  //     })
  //     .from(transactionEntry)
  //     .innerJoin(
  //       transactionAccount,
  //       eq(transactionEntry.transactionAccountId, transactionAccount.id)
  //     )
  //     .innerJoin(
  //       transactionCategory,
  //       eq(transactionEntry.categoryId, transactionCategory.id)
  //     )
  //     .where(
  //       and(
  //         eq(transactionAccount.userId, userId),
  //         eq(transactionEntry.transactionAccountId, mainAccount.id), // Only main account entries
  //         eq(transactionEntry.type, TXN_TYPE.EXPENSE),
  //         lte(transactionEntry.amount, 0), // Only negative amounts (money going out of main account)
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     )
  //     .groupBy(transactionCategory.id, transactionCategory.name)
  //     .orderBy(desc(sum(transactionEntry.amount)));
  //
  //   const totalSpending = categorySpending.reduce(
  //     (sum, cat) => sum + Math.abs(Number(cat.amount)),
  //     0
  //   );
  //
  //   return categorySpending.map((cat) => ({
  //     categoryId: cat.categoryId.toString(),
  //     categoryName: cat.categoryName,
  //     amount: Math.abs(Number(cat.amount)), // Convert negative to positive
  //     percentage:
  //       totalSpending > 0
  //         ? (Math.abs(Number(cat.amount)) / totalSpending) * 100
  //         : 0,
  //     transactionCount: cat.transactionCount,
  //     trend: "stable" as const, // TODO: Implement trend calculation
  //   }));
  // }
  //
  // async getUpcomingBills(userId: number, days: number = 30) {
  //   const now = new Date();
  //   const futureDate = new Date();
  //   futureDate.setDate(now.getDate() + days);
  //
  //   const upcomingRecurring = await this.db
  //     .select({
  //       id: recurring.id,
  //       description: recurring.description,
  //       amount: recurring.amount,
  //       nextDate: recurring.nextDate,
  //       category: transactionAccount.category,
  //     })
  //     .from(recurring)
  //     .innerJoin(
  //       transactionAccount,
  //       eq(recurring.sourcetransactionAccountID, transactionAccount.id)
  //     )
  //     .where(
  //       and(
  //         eq(recurring.userId, userId),
  //         eq(recurring.type, RECURRENCE_TYPE.DEBIT),
  //         gte(recurring.nextDate, now),
  //         lte(recurring.nextDate, futureDate)
  //       )
  //     )
  //     .orderBy(recurring.nextDate);
  //
  //   return upcomingRecurring.map((bill) => ({
  //     id: bill.id.toString(),
  //     description: bill.description,
  //     amount: bill.amount,
  //     dueDate: bill.nextDate.toISOString(),
  //     daysUntilDue: Math.ceil(
  //       (bill.nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  //     ),
  //     category: bill.category,
  //     priority: "medium" as const, // TODO: Implement priority logic
  //   }));
  // }
  //
  // async getNetWorthTrend(userId: number, months: number = 12) {
  //   const results = [];
  //   const now = new Date();
  //
  //   for (let i = months - 1; i >= 0; i--) {
  //     const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
  //
  //     // Get assets and liabilities up to this date
  //     const accountBalances = await this.db
  //       .select({
  //         balance: transactionAccount.balance,
  //       })
  //       .from(transactionAccount)
  //       .where(eq(transactionAccount.userId, userId));
  //
  //     let assets = 0;
  //     let liabilities = 0;
  //
  //     accountBalances.forEach((account) => {
  //       if (account.category === "INCOME" || account.category === "SAVING") {
  //         assets += account.balance;
  //       } else {
  //         liabilities += account.balance;
  //       }
  //     });
  //
  //     const netWorth = assets - liabilities;
  //
  //     results.push({
  //       date: date.toISOString().split("T")[0]!,
  //       netWorth,
  //       assets,
  //       liabilities,
  //       change: 0, // TODO: Calculate change from previous period
  //       changePercentage: 0, // TODO: Calculate percentage change
  //     });
  //   }
  //
  //   // Calculate changes
  //   for (let i = 1; i < results.length; i++) {
  //     const current = results[i]!;
  //     const previous = results[i - 1]!;
  //     current.change = current.netWorth - previous.netWorth;
  //     current.changePercentage =
  //       previous.netWorth !== 0
  //         ? (current.change / previous.netWorth) * 100
  //         : 0;
  //   }
  //
  //   return results;
  // }
  //
  // async getSpendingAnalytics(userId: number, month: Date) {
  //   const spendingByCategory = await this.getSpendingByCategory(userId, month);
  //   const totalSpending = spendingByCategory.reduce(
  //     (sum, cat) => sum + cat.amount,
  //     0
  //   );
  //
  //   const analytics = {
  //     numberOfCategories: spendingByCategory.length,
  //     averageSpendingPerCategory:
  //       spendingByCategory.length > 0
  //         ? totalSpending / spendingByCategory.length
  //         : 0,
  //     minSpending:
  //       spendingByCategory.length > 0
  //         ? Math.min(...spendingByCategory.map((cat) => cat.amount))
  //         : 0,
  //     maxSpending:
  //       spendingByCategory.length > 0
  //         ? Math.max(...spendingByCategory.map((cat) => cat.amount))
  //         : 0,
  //     totalTransactions: spendingByCategory.reduce(
  //       (sum, cat) => sum + cat.transactionCount,
  //       0
  //     ),
  //     sumOfPercentages: spendingByCategory.reduce(
  //       (sum, cat) => sum + cat.percentage,
  //       0
  //     ),
  //     standardDeviation: this.calculateStandardDeviation(
  //       spendingByCategory.map((cat) => cat.amount)
  //     ),
  //   };
  //
  //   return {
  //     totalSpending,
  //     categories: spendingByCategory,
  //     analytics,
  //   };
  // }
  //
  // private async getBudgetUtilization(
  //   userId: number,
  //   month: Date
  // ): Promise<number> {
  //   const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  //   const endOfMonth = new Date(
  //     month.getFullYear(),
  //     month.getMonth() + 1,
  //     0,
  //     23,
  //     59,
  //     59
  //   );
  //
  //   const budgets = await this.db
  //     .select({
  //       budgetId: budget.id,
  //       categoryId: budget.categoryId,
  //       budgetAmount: budget.amount,
  //       spent: sum(transactionEntry.amount),
  //     })
  //     .from(budget)
  //     .leftJoin(
  //       transactionEntry,
  //       and(
  //         eq(transactionEntry.categoryId, budget.categoryId),
  //         eq(transactionEntry.type, TXN_TYPE.EXPENSE),
  //         gte(transactionEntry.amount, 0), // Only positive amounts in category accounts
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     )
  //     .where(
  //       and(eq(budget.userId, userId), eq(budget.period, TIME_PERIOD.MONTHLY))
  //     )
  //     .groupBy(budget.id, budget.categoryId, budget.amount);
  //
  //   if (budgets.length === 0) return 0;
  //
  //   const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  //   const totalSpent = budgets.reduce(
  //     (sum, b) => sum + (Number(b.spent) || 0),
  //     0
  //   );
  //
  //   return totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  // }
  //
  // private async getTopExpenseCategory(userId: number, month: Date) {
  //   const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  //   const endOfMonth = new Date(
  //     month.getFullYear(),
  //     month.getMonth() + 1,
  //     0,
  //     23,
  //     59,
  //     59
  //   );
  //
  //   // Get main account
  //   const mainAccount =
  //     await this.transactionAccountRepository.findMainAccountByUser(userId);
  //   if (!mainAccount) {
  //     return {
  //       name: "No expenses",
  //       amount: 0,
  //       percentage: 0,
  //     };
  //   }
  //
  //   const topCategory = await this.db
  //     .select({
  //       categoryName: transactionCategory.name,
  //       amount: sum(transactionEntry.amount),
  //     })
  //     .from(transactionEntry)
  //     .innerJoin(
  //       transactionAccount,
  //       eq(transactionEntry.transactionAccountId, transactionAccount.id)
  //     )
  //     .innerJoin(
  //       transactionCategory,
  //       eq(transactionEntry.categoryId, transactionCategory.id)
  //     )
  //     .where(
  //       and(
  //         eq(transactionEntry.transactionAccountId, mainAccount.id),
  //         eq(transactionEntry.type, TXN_TYPE.EXPENSE),
  //         lte(transactionEntry.amount, 0), // Only negative amounts in main account
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     )
  //     .groupBy(transactionCategory.id, transactionCategory.name)
  //     .orderBy(desc(sum(transactionEntry.amount)))
  //     .limit(1);
  //
  //   const totalExpenses = await this.db
  //     .select({
  //       total: sum(transactionEntry.amount),
  //     })
  //     .from(transactionEntry)
  //     .where(
  //       and(
  //         eq(transactionEntry.transactionAccountId, mainAccount.id),
  //         eq(transactionEntry.type, TXN_TYPE.EXPENSE),
  //         lte(transactionEntry.amount, 0), // Only negative amounts in main account
  //         gte(transactionEntry.createdAt, startOfMonth),
  //         lte(transactionEntry.createdAt, endOfMonth)
  //       )
  //     );
  //
  //   const total = Math.abs(
  //     Number((totalExpenses[0] && totalExpenses[0].total) || 0)
  //   );
  //   const topCat = topCategory[0];
  //   if (!topCat) {
  //     return {
  //       name: "No expenses",
  //       amount: 0,
  //       percentage: 0,
  //     };
  //   }
  //
  //   const amount = Math.abs(Number(topCat.amount));
  //
  //   return {
  //     name: topCat.categoryName,
  //     amount,
  //     percentage: total > 0 ? (amount / total) * 100 : 0,
  //   };
  // }
  //
  // private calculateStandardDeviation(values: number[]): number {
  //   if (values.length === 0) return 0;
  //
  //   const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  //   const squaredDifferences = values.map((val) => Math.pow(val - mean, 2));
  //   const variance =
  //     squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  //
  //   return Math.sqrt(variance);
  // }
}
