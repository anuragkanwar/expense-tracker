import { container } from "./src/container";
import { db } from "./src/db";

async function testTransactionAPI() {
  console.log("Testing Transaction Service directly...");

  try {
    // Get services from container
    const transactionService = container.resolve("transactionService");

    // Test getTransactions method directly
    console.log("\n1. Testing getTransactions...");
    const transactions = await transactionService.getTransactions(1, {
      page: 1,
      limit: 10,
    });

    console.log(`Found ${transactions.length} transactions`);

    if (transactions.length > 0) {
      const firstTxn = transactions[0];
      console.log("First transaction:", {
        id: firstTxn.id,
        description: firstTxn.description,
        hasEntry: !!firstTxn.entry,
        entryAmount: firstTxn.entry?.amount,
        accountName: firstTxn.entry?.transactionAccount?.name,
        accountType: firstTxn.entry?.transactionAccount?.type,
      });
    }

    console.log("\n✅ Transaction service test completed successfully!");
  } catch (error) {
    console.error("\n❌ Transaction service test failed:", error);
    console.error(
      "Stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
  } finally {
    await db.$client.close();
  }
}

testTransactionAPI();
