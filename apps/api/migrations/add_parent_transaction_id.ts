import { createClient } from "@libsql/client";

// This migration adds the parentTransactionId column to the transaction table
// to support the parent-child relationship for per-allocation ledger entries

export async function runMigration() {
  // Create libsql/Turso client
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "http://127.0.0.1:8080",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log("Starting migration to add parentTransactionId column...");

  try {
    // Execute the migration
    await db.execute(`
      ALTER TABLE transaction
      ADD COLUMN parent_transaction_id INTEGER
      REFERENCES transaction(id);
    `);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await db.close();
  }
}

// Allow running this migration directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
