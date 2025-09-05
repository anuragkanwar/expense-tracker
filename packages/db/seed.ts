#!/usr/bin/env node

import { seedCategories } from "./src/seeds/index.js";

async function main() {
  const userId = process.argv[2];

  try {
    if (userId) {
      await seedCategories(parseInt(userId));
    }
    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
