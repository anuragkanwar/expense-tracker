// Named exports for better tree-shaking and explicit imports

// Student Zod schemas
export {
  studentSelectSchema,
  studentInsertSchema,
  studentInsertSchemaWithValidation,
  studentResponseSchema,
  type StudentSelect,
  type StudentInsert,
  type StudentInsertValidated,
  type StudentResponse,
} from "./students.js";

// Auth Zod schemas
export {
  userSelectSchema,
  userInsertSchema,
  userInsertSchemaWithValidation,
  userResponseSchema,
  sessionSelectSchema,
  sessionInsertSchema,
  sessionInsertSchemaWithValidation,
  sessionResponseSchema,
  accountSelectSchema,
  accountInsertSchema,
  accountInsertSchemaWithValidation,
  accountResponseSchema,
  verificationSelectSchema,
  verificationInsertSchema,
  verificationInsertSchemaWithValidation,
  verificationResponseSchema,
  type UserSelect,
  type UserInsert,
  type UserInsertValidated,
  type UserResponse,
  type SessionSelect,
  type SessionInsert,
  type SessionInsertValidated,
  type SessionResponse,
  type AccountSelect,
  type AccountInsert,
  type AccountInsertValidated,
  type AccountResponse,
  type VerificationSelect,
  type VerificationInsert,
  type VerificationInsertValidated,
  type VerificationResponse,
} from "./auth.js";
