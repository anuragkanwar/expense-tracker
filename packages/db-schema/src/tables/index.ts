// Auth schemas
export { user } from "./user";
export { session } from "./session";
export { account } from "./account";
export { verification } from "./verification";
export {
  friendship,
  friendshipUniqueIndex,
  friendshipUserIndex,
  friendshipStatusIndex,
} from "./friendship";

// Personal finance schemas
export { transactionAccount } from "./transaction-account";
export { transaction } from "./transaction";
export { transactionEntry } from "./transaction-entry";
export { budget } from "./budget";
export { recurring } from "./recurring";

// Splitwise schemas
export { group } from "./group";
export { groupMember } from "./group-member";
// Loan tables have been migrated to the unified expense-share schema
export { userBalance } from "./user-balance";
export { settlement } from "./settlement";
export { expenseShare } from "./expense-share";
export { settlementApplication } from "./settlement-application";
