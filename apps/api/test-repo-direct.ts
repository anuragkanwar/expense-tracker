import { container } from "./src/container";
import { db } from "./src/db";

async function testTransactionRepositoryDirectly() {
  console.log("Testing Transaction Repository findByUserId directly...");

  try {
    // Get repository from container
    const transactionRepository = container.resolve("transactionRepository");

    // Test findByUserId directly
    console.log("\n1. Testing findByUserId for user ID 1...");
    const transactions = await transactionRepository.findByUserId(1);

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

    console.log(
      "\n✅ Transaction repository direct test completed successfully!"
    );
  } catch (error) {
    console.error("\n❌ Transaction repository direct test failed:", error);
    console.error(
      "Stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
  } finally {
    await db.$client.close();
  }
}

testTransactionRepositoryDirectly();
