#!/usr/bin/env node

/**
 * Loan to ExpenseShare Migration Script
 *
 * This script runs the migration of data from the loan and loan_split tables
 * to the unified expense_share table with proper logging and error handling.
 *
 * Usage:
 * node migrate-loans.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run  : Only log what would happen without making changes
 *   --verbose  : Show detailed logs during migration
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { migrateLoanToExpenseShare } from "../dist/db/migrations/loan-to-expense-share-migration.js";

// Setup environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Main execution
async function main() {
  try {
    // Parse CLI arguments
    const args = process.argv.slice(2);
    const isDryRun = args.includes("--dry-run");
    const isVerbose = args.includes("--verbose");

    console.log("Initializing loan to expense_share migration...");

    if (isDryRun) {
      console.log("DRY RUN MODE: No changes will be made to the database");
    }

    if (isVerbose) {
      console.log("VERBOSE MODE: Showing detailed logs");
      // Configure any verbose logging settings
    }

    // Execute the migration
    if (!isDryRun) {
      const result = await migrateLoanToExpenseShare();

      if (result.success) {
        console.log("✅ Migration completed successfully!");
        console.log(`- Migrated records: ${result.migratedCount}`);
        console.log(
          `- Execution time: ${result.executionTimeMs / 1000} seconds`
        );

        if (result.errorCount > 0) {
          console.warn(
            `⚠️ Warning: ${result.errorCount} records could not be migrated. Check the logs for details.`
          );
        }
      } else {
        console.error("❌ Migration failed:", result.error);
        process.exit(1);
      }
    } else {
      console.log("Dry run completed. Migration script loaded successfully.");
    }
  } catch (error) {
    console.error("Failed to execute migration:", error);
    process.exit(1);
  }
}

main();
