import { container } from "./src/container";
import { db } from "./src/db";

async function testTransactionRepository() {
  console.log("Testing Transaction Repository...");

  try {
    // Get repositories from container
    const transactionRepository = container.resolve("transactionRepository");

    // Test findAll
    console.log("\n1. Testing findAll...");
    const allTransactions = await transactionRepository.findAll(10, 0);
    console.log(`Found ${allTransactions.length} transactions`);

    if (allTransactions.length > 0) {
      const firstTxn = allTransactions[0];
      console.log("First transaction:", {
        id: firstTxn.id,
        description: firstTxn.description,
        hasEntry: !!firstTxn.entry,
        entryAmount: firstTxn.entry?.amount,
        accountName: firstTxn.entry?.transactionAccount?.name,
        accountType: firstTxn.entry?.transactionAccount?.type,
      });
    }

    // Test findById
    if (allTransactions.length > 0) {
      console.log("\n2. Testing findById...");
      const singleTxn = await transactionRepository.findById(
        allTransactions[0].id
      );
      if (singleTxn) {
        console.log("Single transaction:", {
          id: singleTxn.id,
          description: singleTxn.description,
          hasEntry: !!singleTxn.entry,
          entryAmount: singleTxn.entry?.amount,
          accountName: singleTxn.entry?.transactionAccount?.name,
          accountType: singleTxn.entry?.transactionAccount?.type,
        });
      }
    }

    console.log("\n✅ Transaction repository test completed successfully!");
  } catch (error) {
    console.error("\n❌ Transaction repository test failed:", error);
  } finally {
    await db.$client.close();
  }
}

testTransactionRepository();
