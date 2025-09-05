import { db } from "../database.js";
import { transactionCategory } from "../schemas/transaction-category.js";
import { TXN_CATEGORY } from "../constants/index.js";

export async function seedCategories(userId: number) {
  const categories = Object.values(TXN_CATEGORY).map((category) => ({
    userId,
    name: category,
    parentCategoryId: null,
  }));

  await db.insert(transactionCategory).values(categories).onConflictDoNothing();

  console.log(`Seeded ${categories.length} categories for user ${userId}`);
}

export async function seedStandardCategories() {
  const categories = Object.values(TXN_CATEGORY).map((category) => ({
    userId: null,
    name: category,
    parentCategoryId: null,
  }));

  await db.insert(transactionCategory).values(categories).onConflictDoNothing();

  console.log(`Seeded ${categories.length} standard categories`);
}
