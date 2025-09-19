#!/usr/bin/env node

import { seedComprehensive } from "./src/db/seeds/comprehensive-seed";

async function main() {
  try {
    console.log("Starting comprehensive seed process...");
    await seedComprehensive();
    console.log("Comprehensive seeding completed successfully");
  } catch (error) {
    console.error("Comprehensive seeding failed:", error);
    process.exit(1);
  }
}

main();
