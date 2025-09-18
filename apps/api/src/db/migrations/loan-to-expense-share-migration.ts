import { db } from "../database";
import { loan, loanSplit, expenseShare } from "@/db";
import {
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
} from "@pocket-pixie/db-schema";
import { eq } from "drizzle-orm";

/**
 * Data migration script to move data from loan and loan_split tables to the unified expense_share table.
 * This is part of the schema unification process described in the refactoring plan.
 *
 * The script will:
 * 1. Fetch all loans with their associated splits
 * 2. For each loan, create a corresponding entry in the expense_share table
 * 3. Log the migration progress and report statistics
 */
export async function migrateLoanToExpenseShare() {
  console.log("Starting loan to expense_share data migration...");

  let migratedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  try {
    // Step 1: Get all loans with their splits
    const allLoans = await db.select().from(loan);
    console.log(`Found ${allLoans.length} loans to migrate.`);

    for (const loanRecord of allLoans) {
      try {
        // Get associated split records for this loan
        const splits = await db
          .select()
          .from(loanSplit)
          .where(eq(loanSplit.loanId, loanRecord.id));

        if (splits.length !== 1) {
          console.warn(
            `Loan ${loanRecord.id} has ${splits.length} splits, expected exactly 1. Handling special case...`
          );
        }

        // For each loan split, create an expense_share entry
        for (const split of splits) {
          await db.transaction(async (tx) => {
            // Map loan and loan_split data to expense_share format
            await tx.insert(expenseShare).values({
              transactionId: loanRecord.transactionId,
              payerUserId: loanRecord.createdBy, // Creditor is the payer
              participantUserId: split.userId, // Debtor is the participant
              groupId: loanRecord.groupId,
              type: EXPENSE_SHARE_TYPE.LOAN,
              description: loanRecord.description,
              shareType: null, // Loans don't have share types
              splitType: split.splitType,
              expenseAccountId: null, // Loans use loan_given/loan_taken accounts not expense accounts
              currency: loanRecord.currency,
              amount: split.amountOwed,
              paidAmount: 0, // Default to unpaid
              status: EXPENSE_SHARE_STATUS.UNPAID,
              realizedAt: null,
              loanDate: loanRecord.loanDate,
              isPayerShare: 0, // Not the payer's share
              metadata: split.metadata, // Preserve any metadata
              createdAt: loanRecord.createdAt,
              updatedAt: loanRecord.updatedAt,
            });
            migratedCount++;
          });
        }
      } catch (error) {
        console.error(`Error migrating loan ${loanRecord.id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Migration completed in ${(Date.now() - startTime) / 1000} seconds.`
    );
    console.log(`Successfully migrated ${migratedCount} loan records.`);
    if (errorCount > 0) {
      console.error(`Failed to migrate ${errorCount} loan records.`);
    }

    return {
      success: true,
      migratedCount,
      errorCount,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Migration failed with error:", error);
    return {
      success: false,
      error: String(error),
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// Helper function for CLI invocation
if (require.main === module) {
  migrateLoanToExpenseShare()
    .then((result) => {
      console.log("Migration result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Unhandled error during migration:", error);
      process.exit(1);
    });
}
