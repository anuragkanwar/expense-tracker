// Named exports for better tree-shaking and explicit imports

// Student Zod schemas
export {
  studentSelectSchema,
  studentInsertSchema,
  studentInsertSchemaWithValidation,
  studentResponseSchema,
  type Student,
  type StudentInsert,
  type StudentInsertValidated,
  type StudentResponse,
} from "./students";

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
  type User,
  type UserInsert,
  type UserInsertValidated,
  type UserResponse,
  type Session,
  type SessionInsert,
  type SessionInsertValidated,
  type SessionResponse,
  type Account,
  type AccountInsert,
  type AccountInsertValidated,
  type AccountResponse,
  type Verification,
  type VerificationInsert,
  type VerificationInsertValidated,
  type VerificationResponse,
} from "./auth";
