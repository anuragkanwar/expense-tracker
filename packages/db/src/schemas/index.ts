// Named exports for better tree-shaking and explicit imports

// Student schemas
export {
  studentTable,
  student,
  type Student,
  type NewStudent,
} from "./students.js";

// Auth schemas
export {
  userTable,
  sessionTable,
  accountTable,
  verificationTable,
  user,
  session,
  account,
  verification,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
} from "./auth.js";
