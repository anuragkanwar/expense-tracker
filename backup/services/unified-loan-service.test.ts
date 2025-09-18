import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db/database";
import { container } from "../container";
import { UnifiedLoanService } from "./unified-loan-service";
import { UnifiedExpenseShareRepository } from "../repositories/unified-expense-share-repository";
import { EXPENSE_SHARE_TYPE, expenseShare } from "../db";
import { sql, like } from "drizzle-orm";

describe("UnifiedLoanService Integration Tests", () => {
  let unifiedLoanService: UnifiedLoanService;
  let unifiedExpenseShareRepository: UnifiedExpenseShareRepository;

  // Test user IDs - assumed to exist in the database
  const testCreditorId = 1;
  const testDebtorId = 2;

  // Setup test environment
  beforeAll(() => {
    const scope = container.createScope();
    unifiedLoanService = scope.resolve("unifiedLoanService");
    unifiedExpenseShareRepository = scope.resolve(
      "unifiedExpenseShareRepository"
    );
  });

  // Clean up after all tests
  afterAll(async () => {
    // Clean up any test data created during tests
    await db
      .delete(expenseShare)
      .where(like(expenseShare.description, "TEST%"));
  });

  describe("Direct Loan Operations", () => {
    it("should create a direct loan between two users", async () => {
      // Create a new loan
      const loanData = {
        debtorId: testDebtorId,
        amount: 100,
        currency: "USD",
        description: "TEST: Integration Test Loan",
      };

      const createdLoan = await unifiedLoanService.createDirectLoanSymmetric(
        loanData,
        testCreditorId
      );

      // Verify loan was created correctly
      expect(createdLoan).toBeDefined();
      expect(createdLoan.amount).toBe(100);
      expect(createdLoan.currency).toBe("USD");
      expect(createdLoan.creditorId).toBe(testCreditorId);
      expect(createdLoan.debtorId).toBe(testDebtorId);
      expect(createdLoan.description).toBe("TEST: Integration Test Loan");

      // Verify loan exists in expense_share table with correct type
      // First fetch the raw expense share record to check type field
      const expenseShareRow = await db
        .select()
        .from(expenseShare)
        .where(like(expenseShare.description, "TEST: Integration Test Loan"))
        .limit(1);

      expect(expenseShareRow.length).toBe(1);
      expect(expenseShareRow[0].type).toBe(EXPENSE_SHARE_TYPE.LOAN);
      expect(expenseShareRow[0].payerUserId).toBe(testCreditorId);
      expect(expenseShareRow[0].participantUserId).toBe(testDebtorId);

      // Also check through the repository method which returns a loan response
      const loanInDb = await unifiedExpenseShareRepository.findLoanById(
        createdLoan.id
      );
      expect(loanInDb).toBeDefined();
      expect(loanInDb?.creditorId).toBe(testCreditorId);
      expect(loanInDb?.debtorId).toBe(testDebtorId);

      // Clean up
      await unifiedExpenseShareRepository.delete(createdLoan.id);
    });

    it("should retrieve a loan by id", async () => {
      // First create a loan
      const loanData = {
        debtorId: testDebtorId,
        amount: 150,
        currency: "EUR",
        description: "TEST: Loan Retrieval Test",
      };

      const createdLoan = await unifiedLoanService.createDirectLoanSymmetric(
        loanData,
        testCreditorId
      );

      // Now retrieve it
      const retrievedLoan = await unifiedLoanService.getLoanById(
        createdLoan.id,
        testCreditorId
      );

      // Verify the retrieved loan matches
      expect(retrievedLoan).toBeDefined();
      expect(retrievedLoan.id).toBe(createdLoan.id);
      expect(retrievedLoan.amount).toBe(150);
      expect(retrievedLoan.currency).toBe("EUR");
      expect(retrievedLoan.creditorId).toBe(testCreditorId);
      expect(retrievedLoan.debtorId).toBe(testDebtorId);
      expect(retrievedLoan.description).toBe("TEST: Loan Retrieval Test");

      // Clean up
      await unifiedExpenseShareRepository.delete(createdLoan.id);
    });

    it("should update a loan", async () => {
      // First create a loan
      const loanData = {
        debtorId: testDebtorId,
        amount: 200,
        currency: "USD",
        description: "TEST: Loan Update Test",
      };

      const createdLoan = await unifiedLoanService.createDirectLoanSymmetric(
        loanData,
        testCreditorId
      );

      // Update the loan
      const updateData = {
        description: "TEST: Updated Loan Description",
        amount: 250,
        currency: "USD",
      };

      const updatedLoan = await unifiedLoanService.updateLoan(
        createdLoan.id,
        testCreditorId,
        updateData
      );

      // Verify the update
      expect(updatedLoan).toBeDefined();
      expect(updatedLoan.id).toBe(createdLoan.id);
      expect(updatedLoan.amount).toBe(250);
      expect(updatedLoan.description).toBe("TEST: Updated Loan Description");

      // Clean up
      await unifiedExpenseShareRepository.delete(createdLoan.id);
    });

    it("should list loans for a user", async () => {
      // Create two test loans
      const loanData1 = {
        debtorId: testDebtorId,
        amount: 100,
        currency: "USD",
        description: "TEST: Loan List Test 1",
      };

      const loanData2 = {
        debtorId: testDebtorId,
        amount: 200,
        currency: "USD",
        description: "TEST: Loan List Test 2",
      };

      const loan1 = await unifiedLoanService.createDirectLoanSymmetric(
        loanData1,
        testCreditorId
      );

      const loan2 = await unifiedLoanService.createDirectLoanSymmetric(
        loanData2,
        testCreditorId
      );

      // Get loans for the creditor
      const loansResult = await unifiedLoanService.getLoans(testCreditorId, {
        page: 1,
        limit: 10,
      });

      // Verify loans are returned
      expect(loansResult).toBeDefined();
      expect(loansResult.loans.length).toBeGreaterThanOrEqual(2);

      // Find our test loans in the results
      const testLoans = loansResult.loans.filter((loan: any) =>
        loan.description.startsWith("TEST: Loan List Test")
      );

      expect(testLoans.length).toBeGreaterThanOrEqual(2);

      // Clean up
      await unifiedExpenseShareRepository.delete(loan1.id);
      await unifiedExpenseShareRepository.delete(loan2.id);
    });

    it("should delete a loan", async () => {
      // First create a loan
      const loanData = {
        debtorId: testDebtorId,
        amount: 300,
        currency: "USD",
        description: "TEST: Loan Delete Test",
      };

      const createdLoan = await unifiedLoanService.createDirectLoanSymmetric(
        loanData,
        testCreditorId
      );

      // Delete the loan
      const deleteResult = await unifiedLoanService.deleteLoan(
        createdLoan.id,
        testCreditorId
      );

      // Verify deletion
      expect(deleteResult).toBeDefined();
      expect(deleteResult.message).toContain("deleted successfully");

      // Verify the loan no longer exists
      try {
        await unifiedLoanService.getLoanById(createdLoan.id, testCreditorId);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("not found");
      }
    });
  });
});
