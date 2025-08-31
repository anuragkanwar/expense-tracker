import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  userTable,
  sessionTable,
  accountTable,
  verificationTable,
} from "../schemas/auth.js";

// ==========================================
// AUTH ZOD SCHEMAS (Auto-generated from Drizzle)
// ==========================================

// User table schemas (auto-generated from userTable)
export const userSelectSchema = createSelectSchema(userTable);
export const userInsertSchema = createInsertSchema(userTable);

// Session table schemas (auto-generated from sessionTable)
export const sessionSelectSchema = createSelectSchema(sessionTable);
export const sessionInsertSchema = createInsertSchema(sessionTable);

// Account table schemas (auto-generated from accountTable)
export const accountSelectSchema = createSelectSchema(accountTable);
export const accountInsertSchema = createInsertSchema(accountTable);

// Verification table schemas (auto-generated from verificationTable)
export const verificationSelectSchema = createSelectSchema(verificationTable);
export const verificationInsertSchema = createInsertSchema(verificationTable);

// Enhanced auth schemas with validations
export const userInsertSchemaWithValidation = createInsertSchema(userTable, {
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format"),
  emailVerified: z.boolean().default(false),
  image: z.string().url().optional(),
});

export const sessionInsertSchemaWithValidation = createInsertSchema(
  sessionTable,
  {
    token: z.string().min(1, "Token is required"),
    userId: z.string().min(1, "User ID is required"),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }
);

export const accountInsertSchemaWithValidation = createInsertSchema(
  accountTable,
  {
    accountId: z.string().min(1, "Account ID is required"),
    providerId: z.string().min(1, "Provider ID is required"),
    userId: z.string().min(1, "User ID is required"),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    idToken: z.string().optional(),
    scope: z.string().optional(),
    password: z.string().optional(),
  }
);

export const verificationInsertSchemaWithValidation = createInsertSchema(
  verificationTable,
  {
    identifier: z.string().min(1, "Identifier is required"),
    value: z.string().min(1, "Value is required"),
    expiresAt: z.date("Expiration date is required"),
  }
);

// Auth response schemas
export const userResponseSchema = userSelectSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sessionResponseSchema = sessionSelectSchema.extend({
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const accountResponseSchema = accountSelectSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const verificationResponseSchema = verificationSelectSchema.extend({
  expiresAt: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type UserSelect = z.infer<typeof userSelectSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserInsertValidated = z.infer<
  typeof userInsertSchemaWithValidation
>;
export type UserResponse = z.infer<typeof userResponseSchema>;

export type SessionSelect = z.infer<typeof sessionSelectSchema>;
export type SessionInsert = z.infer<typeof sessionInsertSchema>;
export type SessionInsertValidated = z.infer<
  typeof sessionInsertSchemaWithValidation
>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export type AccountSelect = z.infer<typeof accountSelectSchema>;
export type AccountInsert = z.infer<typeof accountInsertSchema>;
export type AccountInsertValidated = z.infer<
  typeof accountInsertSchemaWithValidation
>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;

export type VerificationSelect = z.infer<typeof verificationSelectSchema>;
export type VerificationInsert = z.infer<typeof verificationInsertSchema>;
export type VerificationInsertValidated = z.infer<
  typeof verificationInsertSchemaWithValidation
>;
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;
