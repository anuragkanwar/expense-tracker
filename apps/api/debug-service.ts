import { container } from "./src/container";
import { db } from "./src/db";

async function debugTransactionService() {
  console.log("Debugging Transaction Service...");

  try {
    // Get services from container
    const transactionService = container.resolve("transactionService");

    console.log("\n1. Testing getTransactions step by step...");

    // Test with minimal parameters
    const result = await transactionService.getTransactions(1, {});

    console.log("Service result:", JSON.stringify(result, null, 2));

    console.log("\n✅ Debug completed!");
  } catch (error) {
    console.error("\n❌ Debug failed:", error);
    console.error(
      "Stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
  } finally {
    await db.$client.close();
  }
}

debugTransactionService();
