import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "@pocket-pixie/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  plugins: [expo()],
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "pocket-pixie://",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://YOUR_COMPUTER_IP:3000", // Replace with your computer's IP
  ],
});
