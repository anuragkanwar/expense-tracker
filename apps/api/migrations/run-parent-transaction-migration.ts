#!/usr/bin/env node

import { runMigration } from "./add_parent_transaction_id.js";

console.log(
  "Running migration to add parentTransactionId column to transaction table"
);

runMigration()
  .then(() => {
    console.log("Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
