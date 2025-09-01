import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database.js";
import { Redis } from "ioredis";
const redis = new Redis();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secondaryStorage: {
    get: async (key) => {
      return await redis.get(key);
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, "EX", ttl);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  trustedOrigins: [
    "pocket-pixie://",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://YOUR_COMPUTER_IP:3000", // Replace with your computer's IP
  ],
});

