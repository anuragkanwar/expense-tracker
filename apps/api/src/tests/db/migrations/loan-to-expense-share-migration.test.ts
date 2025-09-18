import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../db/database";
import {
  loan,
  loanSplit,
  expenseShare,
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
} from "../../db";
import { migrateLoanToExpenseShare } from "./loan-to-expense-share-migration";
import { and, eq } from "drizzle-orm";

describe("Loan to ExpenseShare Migration Tests", () => {
  // Test data for verification
  const testLoans = [
    {
      id: 999999, // Using high ID to avoid conflicts
      groupId: null,
      description: "Test personal loan",
      amount: 100,
      currency: "USD",
      createdBy: 1,
      transactionId: 10000,
      loanDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 999998,
      groupId: 1,
      description: "Test group loan",
      amount: 200,
      currency: "EUR",
      createdBy: 2,
      transactionId: 10001,
      loanDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const testLoanSplits = [
    {
      id: 999999,
      loanId: 999999,
      userId: 3,
      amountOwed: 100,
      splitType: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 999998,
      loanId: 999998,
      userId: 4,
      amountOwed: 200,
      splitType: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Setup and teardown
  beforeAll(async () => {
    // Clean up any previous test data
    await db.delete(expenseShare).where(eq(expenseShare.transactionId, 10000));
    await db.delete(expenseShare).where(eq(expenseShare.transactionId, 10001));
    await db.delete(loanSplit).where(eq(loanSplit.loanId, 999999));
    await db.delete(loanSplit).where(eq(loanSplit.loanId, 999998));
    await db.delete(loan).where(eq(loan.id, 999999));
    await db.delete(loan).where(eq(loan.id, 999998));

    // Insert test data
    await db.insert(loan).values(testLoans);
    await db.insert(loanSplit).values(testLoanSplits);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(expenseShare).where(eq(expenseShare.transactionId, 10000));
    await db.delete(expenseShare).where(eq(expenseShare.transactionId, 10001));
    await db.delete(loanSplit).where(eq(loanSplit.loanId, 999999));
    await db.delete(loanSplit).where(eq(loanSplit.loanId, 999998));
    await db.delete(loan).where(eq(loan.id, 999999));
    await db.delete(loan).where(eq(loan.id, 999998));
  });

  it("should correctly migrate loans to expense_share table", async () => {
    // Run the migration
    const result = await migrateLoanToExpenseShare();

    // Check the migration ran successfully
    expect(result.success).toBe(true);
    expect(result.migratedCount).toBeGreaterThan(0);

    // Verify our test loans were migrated
    const personalLoan = await db
      .select()
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.transactionId, 10000),
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN)
        )
      );

    const groupLoan = await db
      .select()
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.transactionId, 10001),
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN)
        )
      );

    // Check personal loan was migrated correctly
    expect(personalLoan.length).toBe(1);
    expect(personalLoan[0].transactionId).toBe(10000);
    expect(personalLoan[0].payerUserId).toBe(1);
    expect(personalLoan[0].participantUserId).toBe(3);
    expect(personalLoan[0].amount).toBe(100);
    expect(personalLoan[0].currency).toBe("USD");
    expect(personalLoan[0].groupId).toBeNull();
    expect(personalLoan[0].type).toBe(EXPENSE_SHARE_TYPE.LOAN);
    expect(personalLoan[0].status).toBe(EXPENSE_SHARE_STATUS.UNPAID);

    // Check group loan was migrated correctly
    expect(groupLoan.length).toBe(1);
    expect(groupLoan[0].transactionId).toBe(10001);
    expect(groupLoan[0].payerUserId).toBe(2);
    expect(groupLoan[0].participantUserId).toBe(4);
    expect(groupLoan[0].amount).toBe(200);
    expect(groupLoan[0].currency).toBe("EUR");
    expect(groupLoan[0].groupId).toBe(1);
    expect(groupLoan[0].type).toBe(EXPENSE_SHARE_TYPE.LOAN);
    expect(groupLoan[0].status).toBe(EXPENSE_SHARE_STATUS.UNPAID);
  });
});
