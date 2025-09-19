import { db } from "../database";
import {
  user,
  account,
  friendship,
  group,
  groupMember,
  transactionAccount,
  transaction,
  transactionEntry,
  budget,
  expenseShare,
  settlement,
  settlementApplication,
  userBalance,
  recurring,
} from "@pocket-pixie/db-schema";
import {
  ACCOUNT_TYPE,
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  FRIEND_STATUS,
  RECURRENCE_TYPE,
  SHARE_TYPE,
  SPLIT_TYPE,
  TIME_PERIOD,
} from "@pocket-pixie/db-schema";
import { genSalt, hash } from "bcryptjs";
import { eq, and, isNull } from "drizzle-orm";

// Type definitions
interface UserWithPassword {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

interface CreatedUser extends UserWithPassword {
  id: number;
}

interface GroupData {
  id: number;
  name: string;
  createdBy: number;
  coverPhotoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AccountData {
  id: number;
  userId: number;
  name: string;
  type: ACCOUNT_TYPE;
  isPaymentSource: boolean;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserAccounts {
  income?: AccountData;
  groceries?: AccountData;
  dining?: AccountData;
  entertainment?: AccountData;
  saving?: AccountData;
  loanGiven?: AccountData;
  loanTaken?: AccountData;
  external?: AccountData;
  outgoing?: AccountData;
  [key: string]: AccountData | undefined;
}

interface DbTransaction {
  id: number;
  description: string;
  userId: number;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseShareData {
  id: number;
  transactionId: number;
  payerUserId: number;
  participantUserId: number;
  groupId: number | null;
  type: EXPENSE_SHARE_TYPE;
  description: string;
  shareType: SHARE_TYPE;
  splitType: SPLIT_TYPE | null;
  expenseAccountId: number | null;
  currency: string;
  amount: number;
  paidAmount: number;
  status: EXPENSE_SHARE_STATUS;
  realizedAt: Date;
  loanDate?: Date;
  isPayerShare: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SettlementData {
  id: number;
  payerId: number;
  payeeId: number;
  groupId: number | null;
  transactionId: number;
  amount: number;
  currency: string;
  idempotencyKey: string;
  settledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comprehensive seed function that creates 4 users, 2 groups, friendships,
 * personal transactions, shared expenses, loans, and settlements.
 */
export async function seedComprehensive() {
  console.log("Starting comprehensive seed...");

  // Cleanup (Be careful with this in production!)
  console.log("Cleaning up existing data...");
  await cleanupExistingData();

  // Create 4 users
  console.log("Creating users...");
  const users = await createUsers([
    {
      name: "Alice Smith",
      email: "alice@example.com",
      password: "Password123!",
    },
    { name: "Bob Johnson", email: "bob@example.com", password: "Password123!" },
    {
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: "Password123!",
    },
    {
      name: "Diana Prince",
      email: "diana@example.com",
      password: "Password123!",
    },
  ]);

  // Create friendships
  console.log("Creating friendships...");
  await createFriendships(users);

  // Create 2 groups
  console.log("Creating groups...");
  const groups = await createGroups(users);

  // Create transaction accounts (one set per user)
  console.log("Creating transaction accounts...");
  const accountsByUser = await createTransactionAccounts(users);

  // Create personal transactions for each user
  console.log("Creating personal transactions...");
  await createPersonalTransactions(users, accountsByUser);

  // Create shared expenses
  console.log("Creating shared expenses...");
  await createSharedExpenses(users, accountsByUser, groups);

  // Create direct loans (person to person)
  console.log("Creating direct loans...");
  await createDirectLoans(users, accountsByUser);

  // Create group loans
  console.log("Creating group loans...");
  await createGroupLoans(users, accountsByUser, groups);

  // Create settlements (partial and full payments)
  console.log("Creating settlements...");
  await createSettlements(users, accountsByUser);

  // Create budgets
  console.log("Creating budgets...");
  await createBudgets(users, accountsByUser);

  // Create recurring items
  console.log("Creating recurring items...");
  await createRecurringItems(users, accountsByUser);

  console.log("Comprehensive seed completed successfully!");
}

// Helper function to clean up existing data
async function cleanupExistingData() {
  // Delete data in reverse order of dependencies
  await db.delete(settlementApplication);
  await db.delete(settlement);
  await db.delete(expenseShare);
  await db.delete(userBalance);
  await db.delete(recurring);
  await db.delete(budget);
  await db.delete(transactionEntry);
  await db.delete(transaction);
  await db.delete(transactionAccount);
  await db.delete(groupMember);
  await db.delete(group);
  await db.delete(friendship);
  await db.delete(account);
  await db.delete(user);
}

// Create 4 users
async function createUsers(
  userData: UserWithPassword[]
): Promise<CreatedUser[]> {
  const createdUsers: CreatedUser[] = [];

  for (const data of userData) {
    const salt = await genSalt(10);
    const hashedPassword = await hash(data.password, salt);

    const result = await db
      .insert(user)
      .values({
        name: data.name,
        email: data.email,
        currency: data.currency || "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: user.id });

    if (result.length === 0) {
      throw new Error(`Failed to create user: ${data.email}`);
    }

    const userId = result[0]?.id;

    if (userId === undefined) {
      throw new Error(`Failed to get ID for user: ${data.email}`);
    }

    // Create account for auth
    await db.insert(account).values({
      accountId: "credentials", // Changed from provider
      providerId: userId.toString(), // Changed from providerAccountId
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    createdUsers.push({ id: userId, ...data });
  }

  return createdUsers;
}

// Create friendships between users (everyone friends with everyone)
async function createFriendships(users: CreatedUser[]) {
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    if (!user1 || !user1.id) continue;

    for (let j = i + 1; j < users.length; j++) {
      const user2 = users[j];
      if (!user2 || !user2.id) continue;

      await db.insert(friendship).values({
        userId1: user1.id,
        userId2: user2.id,
        status: FRIEND_STATUS.ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

// Create 2 groups with different members
async function createGroups(users: CreatedUser[]): Promise<GroupData[]> {
  if (users.length < 4) {
    throw new Error("Need at least 4 users to create groups");
  }

  const result: GroupData[] = [];

  // Ensure user IDs are available
  const userId0 = users[0]?.id;
  const userId1 = users[1]?.id;

  if (!userId0 || !userId1) {
    throw new Error("User IDs are undefined");
  }

  // Create Group 1 - Roommates (Alice, Bob, Charlie)
  const group1Result = await db
    .insert(group)
    .values({
      name: "Roommates",
      createdBy: userId0,
      coverPhotoURL: "https://picsum.photos/seed/roommates/200/300",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (group1Result.length === 0 || !group1Result[0]) {
    throw new Error("Failed to create Roommates group");
  }

  const group1Data = group1Result[0];

  // Check if all required properties exist
  if (
    !group1Data.id ||
    !group1Data.name ||
    !group1Data.createdBy ||
    !group1Data.createdAt ||
    !group1Data.updatedAt
  ) {
    throw new Error("Incomplete data returned for Roommates group");
  }

  const roommates: GroupData = {
    id: group1Data.id,
    name: group1Data.name,
    createdBy: group1Data.createdBy,
    coverPhotoURL: group1Data.coverPhotoURL || null,
    createdAt: group1Data.createdAt,
    updatedAt: group1Data.updatedAt,
  };

  result.push(roommates);

  // Add members to Group 1
  for (let i = 0; i < 3 && i < users.length; i++) {
    const user = users[i];
    if (user && user.id && roommates && roommates.id) {
      await db.insert(groupMember).values({
        groupId: roommates.id,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Create Group 2 - Travel Buddies (Bob, Charlie, Diana)
  const group2Result = await db
    .insert(group)
    .values({
      name: "Travel Buddies",
      createdBy: userId1,
      coverPhotoURL: "https://picsum.photos/seed/travel/200/300",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (group2Result.length === 0 || !group2Result[0]) {
    throw new Error("Failed to create Travel Buddies group");
  }

  const group2Data = group2Result[0];

  // Check if all required properties exist
  if (
    !group2Data.id ||
    !group2Data.name ||
    !group2Data.createdBy ||
    !group2Data.createdAt ||
    !group2Data.updatedAt
  ) {
    throw new Error("Incomplete data returned for Travel Buddies group");
  }

  const travelBuddies: GroupData = {
    id: group2Data.id,
    name: group2Data.name,
    createdBy: group2Data.createdBy,
    coverPhotoURL: group2Data.coverPhotoURL || null,
    createdAt: group2Data.createdAt,
    updatedAt: group2Data.updatedAt,
  };

  result.push(travelBuddies);

  // Add members to Group 2
  for (let i = 1; i < 4 && i < users.length; i++) {
    const user = users[i];
    if (user && user.id && travelBuddies && travelBuddies.id) {
      await db.insert(groupMember).values({
        groupId: travelBuddies.id,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  return result;
}

// Helper function to create a transaction account
async function createAccount(
  userId: number,
  name: string,
  accountType: ACCOUNT_TYPE,
  isPaymentSource: boolean = false
): Promise<AccountData | null> {
  // Check if userId is valid
  if (!userId) {
    console.error("Invalid user ID provided to createAccount");
    return null;
  }

  const result = await db
    .insert(transactionAccount)
    .values({
      userId: userId,
      name: name,
      type: accountType, // This is now properly typed as ACCOUNT_TYPE enum
      balance: 0,
      currency: "USD",
      isPaymentSource: isPaymentSource,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (result.length === 0) {
    console.error(`Failed to create ${name} account for user ${userId}`);
    return null;
  }

  if (!result[0] || !result[0].type) {
    console.error("Invalid result data when creating account");
    return null;
  }

  return {
    ...result[0],
    type: result[0].type as ACCOUNT_TYPE, // Ensure proper typing when returning
  } as AccountData;
}

// Create transaction accounts for each user
async function createTransactionAccounts(
  users: CreatedUser[]
): Promise<Record<number, UserAccounts>> {
  const accountsByUser: Record<number, UserAccounts> = {};

  for (const user of users) {
    const accounts: UserAccounts = {};

    // Create income account
    const incomeAccount = await createAccount(
      user.id,
      "Salary",
      ACCOUNT_TYPE.INCOME
    );
    if (incomeAccount) accounts.income = incomeAccount;

    // Create expense accounts
    const groceriesAccount = await createAccount(
      user.id,
      "Groceries",
      ACCOUNT_TYPE.EXPENSE
    );
    if (groceriesAccount) accounts.groceries = groceriesAccount;

    const diningAccount = await createAccount(
      user.id,
      "Dining Out",
      ACCOUNT_TYPE.EXPENSE
    );
    if (diningAccount) accounts.dining = diningAccount;

    const entertainmentAccount = await createAccount(
      user.id,
      "Entertainment",
      ACCOUNT_TYPE.EXPENSE
    );
    if (entertainmentAccount) accounts.entertainment = entertainmentAccount;

    // Create saving account
    const savingAccount = await createAccount(
      user.id,
      "Savings",
      ACCOUNT_TYPE.SAVING
    );
    if (savingAccount) accounts.saving = savingAccount;

    // Create loan accounts
    const loanGivenAccount = await createAccount(
      user.id,
      "Loans Given",
      ACCOUNT_TYPE.LOAN_GIVEN
    );
    if (loanGivenAccount) accounts.loanGiven = loanGivenAccount;

    const loanTakenAccount = await createAccount(
      user.id,
      "Loans Taken",
      ACCOUNT_TYPE.LOAN_TAKEN
    );
    if (loanTakenAccount) accounts.loanTaken = loanTakenAccount;

    // Create external account
    const externalAccount = await createAccount(
      user.id,
      "External",
      ACCOUNT_TYPE.EXTERNAL
    );
    if (externalAccount) accounts.external = externalAccount;

    // Create outgoing account
    const outgoingAccount = await createAccount(
      user.id,
      "Outgoing",
      ACCOUNT_TYPE.OUTGOING,
      true
    );
    if (outgoingAccount) accounts.outgoing = outgoingAccount;

    accountsByUser[user.id] = accounts;
  }

  return accountsByUser;
}

// Helper function to create a transaction
async function createTransaction(
  userId: number,
  description: string,
  transactionDate: Date
): Promise<DbTransaction | null> {
  const result = await db
    .insert(transaction)
    .values({
      description,
      userId,
      transactionDate,
      createdAt: transactionDate,
      updatedAt: transactionDate,
    })
    .returning();

  if (result.length === 0) {
    console.error(
      `Failed to create transaction: ${description} for user ${userId}`
    );
    return null;
  }

  return result[0] as DbTransaction;
}

// Helper function to create transaction entries
async function createTransactionEntries(
  transactionId: number,
  entries: Array<{ accountId: number; amount: number; date: Date }>
): Promise<boolean> {
  try {
    const values = entries.map((entry) => ({
      transactionId,
      transactionAccountId: entry.accountId,
      amount: entry.amount,
      createdAt: entry.date,
      updatedAt: entry.date,
    }));

    await db.insert(transactionEntry).values(values);
    return true;
  } catch (error) {
    console.error(
      `Failed to create transaction entries for transaction ${transactionId}:`,
      error
    );
    return false;
  }
}

// Create personal transactions for each user
async function createPersonalTransactions(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>
) {
  for (const user of users) {
    if (!user || !user.id) {
      console.error("Invalid user object");
      continue;
    }

    const accounts = accountsByUser[user.id];

    if (!accounts) {
      console.error(`No accounts found for user: ${user.id}`);
      continue;
    }

    // Create an income transaction
    if (accounts.external && accounts.income) {
      const incomeDate = new Date(2025, 0, 15); // January 15, 2025
      const incomeTransaction = await createTransaction(
        user.id,
        "Monthly Salary",
        incomeDate
      );

      if (incomeTransaction) {
        await createTransactionEntries(incomeTransaction.id, [
          { accountId: accounts.external.id, amount: -5000, date: incomeDate },
          { accountId: accounts.income.id, amount: 5000, date: incomeDate },
        ]);
      }
    }

    // Create a grocery expense
    if (accounts.outgoing && accounts.groceries) {
      const groceryDate = new Date(2025, 0, 18); // January 18, 2025
      const groceryTransaction = await createTransaction(
        user.id,
        "Weekly Grocery Shopping",
        groceryDate
      );

      if (groceryTransaction) {
        await createTransactionEntries(groceryTransaction.id, [
          { accountId: accounts.outgoing.id, amount: -120, date: groceryDate },
          { accountId: accounts.groceries.id, amount: 120, date: groceryDate },
        ]);
      }
    }

    // Create a dining expense
    if (accounts.outgoing && accounts.dining) {
      const diningDate = new Date(2025, 0, 20); // January 20, 2025
      const diningTransaction = await createTransaction(
        user.id,
        "Dinner at Italian Restaurant",
        diningDate
      );

      if (diningTransaction) {
        await createTransactionEntries(diningTransaction.id, [
          { accountId: accounts.outgoing.id, amount: -85, date: diningDate },
          { accountId: accounts.dining.id, amount: 85, date: diningDate },
        ]);
      }
    }

    // Create a saving transaction
    if (accounts.outgoing && accounts.saving) {
      const savingDate = new Date(2025, 0, 25); // January 25, 2025
      const savingTransaction = await createTransaction(
        user.id,
        "Monthly Savings",
        savingDate
      );

      if (savingTransaction) {
        await createTransactionEntries(savingTransaction.id, [
          { accountId: accounts.outgoing.id, amount: -1000, date: savingDate },
          { accountId: accounts.saving.id, amount: 1000, date: savingDate },
        ]);
      }
    }
  }
}

// Create expense share records
async function createExpenseShare(
  transactionId: number,
  payerUserId: number,
  participantUserId: number,
  groupId: number | null,
  description: string,
  amount: number,
  paidAmount: number,
  status: EXPENSE_SHARE_STATUS,
  date: Date,
  expenseAccountId: number | null,
  isPayerShare: number,
  type = EXPENSE_SHARE_TYPE.EXPENSE,
  shareType = SHARE_TYPE.GROUP,
  splitType: SPLIT_TYPE | null = null,
  loanDate?: Date
): Promise<ExpenseShareData | null> {
  try {
    const values = {
      transactionId,
      payerUserId,
      participantUserId,
      groupId,
      type,
      description,
      shareType,
      splitType,
      expenseAccountId,
      currency: "USD",
      amount,
      paidAmount,
      status,
      realizedAt: date,
      loanDate,
      isPayerShare,
      createdAt: date,
      updatedAt: date,
    };

    const result = await db.insert(expenseShare).values(values).returning();

    if (result.length === 0) {
      console.error(
        `Failed to create expense share for transaction ${transactionId}`
      );
      return null;
    }

    const expenseShareResult = result[0];

    if (!expenseShareResult) {
      console.error("Invalid expense share result data");
      return null;
    }

    return {
      ...expenseShareResult,
      type: expenseShareResult.type as EXPENSE_SHARE_TYPE,
      shareType: expenseShareResult.shareType as SHARE_TYPE,
      splitType: expenseShareResult.splitType as SPLIT_TYPE | null,
      status: expenseShareResult.status as EXPENSE_SHARE_STATUS,
    } as ExpenseShareData;
  } catch (error) {
    console.error(`Failed to create expense share:`, error);
    return null;
  }
}

// Update user balance
async function updateUserBalance(
  ownerId: number,
  counterPartyId: number,
  groupId: number | null,
  amount: number,
  date: Date
): Promise<void> {
  try {
    // Check if inputs are valid
    if (!ownerId || !counterPartyId) {
      console.error("Invalid user IDs for updating balance");
      return;
    }

    // Check if the balance already exists
    const existingBalance = await db
      .select()
      .from(userBalance)
      .where(
        and(
          eq(userBalance.ownerId, ownerId),
          eq(userBalance.counterPartyId, counterPartyId),
          groupId === null
            ? isNull(userBalance.groupId)
            : eq(userBalance.groupId, groupId)
        )
      );

    if (existingBalance.length > 0 && existingBalance[0]) {
      const userBalanceRecord = existingBalance[0];
      const currentBalance = userBalanceRecord.amount;

      if (currentBalance === undefined || currentBalance === null) {
        console.error("Current balance is undefined or null");
        return;
      }

      // Update existing balance
      await db
        .update(userBalance)
        .set({
          amount: currentBalance + amount,
          updatedAt: date,
        })
        .where(
          and(
            eq(userBalance.ownerId, ownerId),
            eq(userBalance.counterPartyId, counterPartyId),
            groupId === null
              ? isNull(userBalance.groupId)
              : eq(userBalance.groupId, groupId)
          )
        );
    } else {
      // Create new balance
      await db.insert(userBalance).values({
        ownerId,
        counterPartyId,
        groupId,
        amount,
        currency: "USD",
        createdAt: date,
        updatedAt: date,
      });
    }
  } catch (error) {
    console.error(`Failed to update user balance:`, error);
  }
}

// Create shared expenses
async function createSharedExpenses(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>,
  groups: GroupData[]
) {
  if (users.length < 4 || groups.length < 2) {
    console.error("Not enough users or groups for shared expenses");
    return;
  }

  // Check if user objects are properly defined
  if (!users[0] || !users[1] || !users[2] || !users[3]) {
    console.error("One or more required users are undefined");
    return;
  }

  const aliceId = users[0].id;
  const bobId = users[1].id;
  const charlieId = users[2].id;
  const dianaId = users[3].id;

  // Check if group objects exist
  if (!groups[0] || !groups[1]) {
    console.error("One or more required groups are undefined");
    return;
  }

  const roommates = groups[0];
  const travelBuddies = groups[1];

  const aliceAccounts = accountsByUser[aliceId];
  const bobAccounts = accountsByUser[bobId];
  const charlieAccounts = accountsByUser[charlieId];
  const dianaAccounts = accountsByUser[dianaId];

  if (!aliceAccounts || !bobAccounts || !charlieAccounts || !dianaAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  if (!aliceAccounts || !bobAccounts || !charlieAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  // Check if required accounts exist
  if (
    !aliceAccounts.outgoing ||
    !aliceAccounts.entertainment ||
    !aliceAccounts.loanGiven ||
    !bobAccounts.loanTaken ||
    !charlieAccounts.loanTaken
  ) {
    console.error("Missing required accounts for shared expenses");
    return;
  }

  // Alice pays for utilities that will be split among roommates
  const utilitiesDate = new Date(2025, 0, 22); // January 22, 2025
  const utilitiesTransaction = await createTransaction(
    aliceId,
    "Monthly Utilities",
    utilitiesDate
  );

  if (!utilitiesTransaction) {
    console.error("Failed to create utilities transaction");
    return;
  }

  const aliceShare = 100; // Alice pays $100
  const bobShare = 100; // Bob owes $100
  const charlieShare = 100; // Charlie owes $100

  // Create entries for utilities transaction (Alice's own share)
  await createTransactionEntries(utilitiesTransaction.id, [
    {
      accountId: aliceAccounts.outgoing.id,
      amount: -aliceShare,
      date: utilitiesDate,
    },
    {
      accountId: aliceAccounts.entertainment.id,
      amount: aliceShare,
      date: utilitiesDate,
    },
  ]);

  // Create loan-style entries for Bob's share
  await createTransactionEntries(utilitiesTransaction.id, [
    {
      accountId: aliceAccounts.loanGiven.id,
      amount: -bobShare,
      date: utilitiesDate,
    },
    {
      accountId: bobAccounts.loanTaken.id,
      amount: bobShare,
      date: utilitiesDate,
    },
  ]);

  // Create loan-style entries for Charlie's share
  await createTransactionEntries(utilitiesTransaction.id, [
    {
      accountId: aliceAccounts.loanGiven.id,
      amount: -charlieShare,
      date: utilitiesDate,
    },
    {
      accountId: charlieAccounts.loanTaken.id,
      amount: charlieShare,
      date: utilitiesDate,
    },
  ]);

  // Create expense_share records
  // Verify roommates group has valid ID
  if (!roommates || !roommates.id) {
    console.error("Roommates group ID is undefined");
    return;
  }

  // Alice's own share (marked as isPayerShare=1)
  await createExpenseShare(
    utilitiesTransaction.id,
    aliceId,
    aliceId, // Self
    roommates.id,
    "Monthly Utilities",
    aliceShare,
    aliceShare, // Already paid (self)
    EXPENSE_SHARE_STATUS.PAID,
    utilitiesDate,
    aliceAccounts.entertainment.id,
    1 // Mark as payer's own share
  );

  // Bob's share
  await createExpenseShare(
    utilitiesTransaction.id,
    aliceId,
    bobId,
    roommates.id,
    "Monthly Utilities",
    bobShare,
    0, // Not paid yet
    EXPENSE_SHARE_STATUS.UNPAID,
    utilitiesDate,
    aliceAccounts.entertainment.id,
    0 // Not payer's share
  );

  // Charlie's share
  await createExpenseShare(
    utilitiesTransaction.id,
    aliceId,
    charlieId,
    roommates.id,
    "Monthly Utilities",
    charlieShare,
    0, // Not paid yet
    EXPENSE_SHARE_STATUS.UNPAID,
    utilitiesDate,
    aliceAccounts.entertainment.id,
    0 // Not payer's share
  );

  // Update user balances - roommates group ID is already verified above
  if (roommates && roommates.id) {
    await updateUserBalance(
      aliceId,
      bobId,
      roommates.id,
      bobShare,
      utilitiesDate
    );
    await updateUserBalance(
      bobId,
      aliceId,
      roommates.id,
      -bobShare,
      utilitiesDate
    );
    await updateUserBalance(
      aliceId,
      charlieId,
      roommates.id,
      charlieShare,
      utilitiesDate
    );
    await updateUserBalance(
      charlieId,
      aliceId,
      roommates.id,
      -charlieShare,
      utilitiesDate
    );
  }

  // Create another shared expense in the Travel Buddies group
  // We already have dianaId and dianaAccounts defined above
  const bobAccounts1 = bobAccounts; // Re-use the bobAccounts reference
  const charlieAccounts1 = charlieAccounts; // Re-use the charlieAccounts reference

  if (!bobAccounts1 || !charlieAccounts1 || !dianaAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  // Check if required accounts exist
  if (
    !bobAccounts1.outgoing ||
    !bobAccounts1.entertainment ||
    !bobAccounts1.loanGiven ||
    !charlieAccounts1.loanTaken ||
    !dianaAccounts.loanTaken
  ) {
    console.error("Missing required accounts for hotel expense");
    return;
  }

  // Bob pays for hotel that will be split among travel buddies
  const hotelDate = new Date(2025, 0, 28); // January 28, 2025
  const hotelTransaction = await createTransaction(
    bobId,
    "Hotel for Weekend Trip",
    hotelDate
  );

  if (!hotelTransaction) {
    console.error("Failed to create hotel transaction");
    return;
  }

  const bobHotelShare = 200; // Bob pays $200
  const charlieHotelShare = 200; // Charlie owes $200
  const dianaHotelShare = 200; // Diana owes $200

  // Create entries for hotel transaction (Bob's own share)
  await createTransactionEntries(hotelTransaction.id, [
    {
      accountId: bobAccounts1.outgoing.id,
      amount: -bobHotelShare,
      date: hotelDate,
    },
    {
      accountId: bobAccounts1.entertainment.id,
      amount: bobHotelShare,
      date: hotelDate,
    },
  ]);

  // Create loan-style entries for Charlie's share
  await createTransactionEntries(hotelTransaction.id, [
    {
      accountId: bobAccounts1.loanGiven.id,
      amount: -charlieHotelShare,
      date: hotelDate,
    },
    {
      accountId: charlieAccounts1.loanTaken.id,
      amount: charlieHotelShare,
      date: hotelDate,
    },
  ]);

  // Create loan-style entries for Diana's share
  await createTransactionEntries(hotelTransaction.id, [
    {
      accountId: bobAccounts1.loanGiven.id,
      amount: -dianaHotelShare,
      date: hotelDate,
    },
    {
      accountId: dianaAccounts.loanTaken.id,
      amount: dianaHotelShare,
      date: hotelDate,
    },
  ]);

  // Create expense_share records
  // Verify travelBuddies group has valid ID
  if (!travelBuddies || !travelBuddies.id) {
    console.error("Travel Buddies group ID is undefined");
    return;
  }

  // Bob's own share (marked as isPayerShare=1)
  await createExpenseShare(
    hotelTransaction.id,
    bobId,
    bobId, // Self
    travelBuddies.id,
    "Hotel for Weekend Trip",
    bobHotelShare,
    bobHotelShare, // Already paid (self)
    EXPENSE_SHARE_STATUS.PAID,
    hotelDate,
    bobAccounts1.entertainment.id,
    1 // Mark as payer's own share
  );

  // Charlie's share
  await createExpenseShare(
    hotelTransaction.id,
    bobId,
    charlieId,
    travelBuddies.id,
    "Hotel for Weekend Trip",
    charlieHotelShare,
    0, // Not paid yet
    EXPENSE_SHARE_STATUS.UNPAID,
    hotelDate,
    bobAccounts1.entertainment.id,
    0 // Not payer's share
  );

  // Diana's share
  await createExpenseShare(
    hotelTransaction.id,
    bobId,
    dianaId,
    travelBuddies.id,
    "Hotel for Weekend Trip",
    dianaHotelShare,
    0, // Not paid yet
    EXPENSE_SHARE_STATUS.UNPAID,
    hotelDate,
    bobAccounts1.entertainment.id,
    0 // Not payer's share
  );

  // Update user balances - travelBuddies group ID is already verified above
  if (travelBuddies && travelBuddies.id) {
    await updateUserBalance(
      bobId,
      charlieId,
      travelBuddies.id,
      charlieHotelShare,
      hotelDate
    );
    await updateUserBalance(
      charlieId,
      bobId,
      travelBuddies.id,
      -charlieHotelShare,
      hotelDate
    );
    await updateUserBalance(
      bobId,
      dianaId,
      travelBuddies.id,
      dianaHotelShare,
      hotelDate
    );
    await updateUserBalance(
      dianaId,
      bobId,
      travelBuddies.id,
      -dianaHotelShare,
      hotelDate
    );
  }
}

// Create direct loans between users
async function createDirectLoans(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>
) {
  if (users.length < 4) {
    console.error("Not enough users for direct loans");
    return;
  }

  // Check if user objects are properly defined
  if (!users[0] || !users[1] || !users[2] || !users[3]) {
    console.error("One or more required users are undefined");
    return;
  }

  const aliceId = users[0].id;
  const bobId = users[1].id;
  const charlieId = users[2].id;
  const dianaId = users[3].id;

  const aliceAccounts = accountsByUser[aliceId];
  const bobAccounts = accountsByUser[bobId];
  const charlieAccounts = accountsByUser[charlieId];
  const dianaAccounts = accountsByUser[dianaId];

  if (!aliceAccounts || !bobAccounts || !charlieAccounts || !dianaAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  // Check if required accounts exist
  if (!aliceAccounts.loanGiven || !bobAccounts.loanTaken) {
    console.error("Missing required accounts for Alice to Bob loan");
    return;
  }

  // Alice lends $500 to Bob
  const aliceToBobLoanDate = new Date(2025, 0, 10); // January 10, 2025
  const aliceToBobLoanAmount = 500;

  const aliceToBobTransaction = await createTransaction(
    aliceId,
    "Personal Loan to Bob",
    aliceToBobLoanDate
  );

  if (aliceToBobTransaction) {
    await createTransactionEntries(aliceToBobTransaction.id, [
      {
        accountId: aliceAccounts.loanGiven.id,
        amount: -aliceToBobLoanAmount,
        date: aliceToBobLoanDate,
      },
      {
        accountId: bobAccounts.loanTaken.id,
        amount: aliceToBobLoanAmount,
        date: aliceToBobLoanDate,
      },
    ]);

    // Create expense share for the loan
    await createExpenseShare(
      aliceToBobTransaction.id,
      aliceId,
      bobId,
      null, // Personal loan, no group
      "Personal Loan to Bob",
      aliceToBobLoanAmount,
      0, // Not paid yet
      EXPENSE_SHARE_STATUS.UNPAID,
      aliceToBobLoanDate,
      null,
      0, // Not payer's share
      EXPENSE_SHARE_TYPE.LOAN,
      SHARE_TYPE.NONE,
      null,
      aliceToBobLoanDate // Add loan date
    );

    // Update user balances
    await updateUserBalance(
      aliceId,
      bobId,
      null,
      aliceToBobLoanAmount,
      aliceToBobLoanDate
    );
    await updateUserBalance(
      bobId,
      aliceId,
      null,
      -aliceToBobLoanAmount,
      aliceToBobLoanDate
    );
  }

  // Check if required accounts exist
  if (!charlieAccounts.loanGiven || !dianaAccounts.loanTaken) {
    console.error("Missing required accounts for Charlie to Diana loan");
    return;
  }

  // Charlie lends $350 to Diana
  const charlieToDianaLoanDate = new Date(2025, 0, 12); // January 12, 2025
  const charlieToDianaLoanAmount = 350;

  const charlieToDianaTransaction = await createTransaction(
    charlieId,
    "Personal Loan to Diana",
    charlieToDianaLoanDate
  );

  if (charlieToDianaTransaction) {
    await createTransactionEntries(charlieToDianaTransaction.id, [
      {
        accountId: charlieAccounts.loanGiven.id,
        amount: -charlieToDianaLoanAmount,
        date: charlieToDianaLoanDate,
      },
      {
        accountId: dianaAccounts.loanTaken.id,
        amount: charlieToDianaLoanAmount,
        date: charlieToDianaLoanDate,
      },
    ]);

    // Create expense share for the loan
    await createExpenseShare(
      charlieToDianaTransaction.id,
      charlieId,
      dianaId,
      null, // Personal loan, no group
      "Personal Loan to Diana",
      charlieToDianaLoanAmount,
      0, // Not paid yet
      EXPENSE_SHARE_STATUS.UNPAID,
      charlieToDianaLoanDate,
      null,
      0, // Not payer's share
      EXPENSE_SHARE_TYPE.LOAN,
      SHARE_TYPE.NONE,
      null,
      charlieToDianaLoanDate // Add loan date
    );

    // Update user balances
    await updateUserBalance(
      charlieId,
      dianaId,
      null,
      charlieToDianaLoanAmount,
      charlieToDianaLoanDate
    );
    await updateUserBalance(
      dianaId,
      charlieId,
      null,
      -charlieToDianaLoanAmount,
      charlieToDianaLoanDate
    );
  }
}

// Create group loans
async function createGroupLoans(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>,
  groups: GroupData[]
) {
  if (users.length < 3 || groups.length < 1) {
    console.error("Not enough users or groups for group loans");
    return;
  }

  // Verify user objects exist and have valid IDs
  const alice = users[0];
  const charlie = users[2];

  if (!alice?.id || !charlie?.id || !groups[0]?.id) {
    console.error(
      "One or more required users or groups are undefined or missing IDs"
    );
    return;
  }

  const aliceId = alice.id;
  const charlieId = charlie.id;
  const roommates = groups[0];

  const aliceAccounts = accountsByUser[aliceId];
  const charlieAccounts = accountsByUser[charlieId];

  if (!aliceAccounts || !charlieAccounts) {
    console.error("Missing accounts for Alice or Charlie");
    return;
  }

  if (!aliceAccounts || !charlieAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  // Check if required accounts exist
  if (!aliceAccounts.loanGiven || !charlieAccounts.loanTaken) {
    console.error("Missing required accounts for Alice to Charlie loan");
    return;
  }

  // Alice lends $300 to Charlie in Roommates group
  const aliceToCharlieLoanDate = new Date(2025, 0, 24); // January 24, 2025
  const aliceToCharlieLoanAmount = 300;

  const aliceToCharlieTransaction = await createTransaction(
    aliceId,
    "Group Loan to Charlie for Rent",
    aliceToCharlieLoanDate
  );

  if (aliceToCharlieTransaction) {
    await createTransactionEntries(aliceToCharlieTransaction.id, [
      {
        accountId: aliceAccounts.loanGiven.id,
        amount: -aliceToCharlieLoanAmount,
        date: aliceToCharlieLoanDate,
      },
      {
        accountId: charlieAccounts.loanTaken.id,
        amount: aliceToCharlieLoanAmount,
        date: aliceToCharlieLoanDate,
      },
    ]);

    // Create expense share for the loan - ensure roommates has id
    if (roommates && roommates.id) {
      await createExpenseShare(
        aliceToCharlieTransaction.id,
        aliceId,
        charlieId,
        roommates.id, // Group loan
        "Group Loan to Charlie for Rent",
        aliceToCharlieLoanAmount,
        0, // Not paid yet
        EXPENSE_SHARE_STATUS.UNPAID,
        aliceToCharlieLoanDate,
        null,
        0, // Not payer's share
        EXPENSE_SHARE_TYPE.LOAN,
        SHARE_TYPE.GROUP,
        null,
        aliceToCharlieLoanDate // Add loan date
      );

      // Update user balances
      await updateUserBalance(
        aliceId,
        charlieId,
        roommates.id,
        aliceToCharlieLoanAmount,
        aliceToCharlieLoanDate
      );
      await updateUserBalance(
        charlieId,
        aliceId,
        roommates.id,
        -aliceToCharlieLoanAmount,
        aliceToCharlieLoanDate
      );
    } else {
      console.error("Roommates group ID is undefined");
    }
  }
}

// Create a settlement record
async function createSettlementRecord(
  payerId: number,
  payeeId: number,
  groupId: number | null,
  transactionId: number,
  amount: number,
  idempotencyKey: string,
  settledAt: Date
): Promise<SettlementData | null> {
  try {
    const result = await db
      .insert(settlement)
      .values({
        payerId,
        payeeId,
        groupId,
        transactionId,
        amount,
        currency: "USD",
        idempotencyKey,
        settledAt,
        createdAt: settledAt,
        updatedAt: settledAt,
      })
      .returning();

    if (result.length === 0) {
      console.error(
        `Failed to create settlement for transaction ${transactionId}`
      );
      return null;
    }

    return result[0] as SettlementData;
  } catch (error) {
    console.error(`Failed to create settlement:`, error);
    return null;
  }
}

// Create settlements
async function createSettlements(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>
) {
  if (users.length < 4) {
    console.error("Not enough users for settlements");
    return;
  }

  // Check if user objects are properly defined
  if (!users[0] || !users[1] || !users[2] || !users[3]) {
    console.error("One or more required users are undefined");
    return;
  }

  const aliceId = users[0].id;
  const bobId = users[1].id;
  const charlieId = users[2].id;
  const dianaId = users[3].id;

  const aliceAccounts = accountsByUser[aliceId];
  const bobAccounts = accountsByUser[bobId];
  const charlieAccounts = accountsByUser[charlieId];
  const dianaAccounts = accountsByUser[dianaId];

  if (!aliceAccounts || !bobAccounts || !charlieAccounts || !dianaAccounts) {
    console.error("Missing accounts for one or more users");
    return;
  }

  // Check if required accounts exist for Bob to Alice partial settlement
  if (!bobAccounts.loanTaken || !aliceAccounts.loanGiven) {
    console.error("Missing required accounts for Bob to Alice settlement");
    return;
  }

  // Bob partially pays back Alice ($200 out of $500 personal loan)
  const bobToAliceSettlementDate = new Date(2025, 1, 5); // February 5, 2025
  const bobToAliceSettlementAmount = 200;

  // Find the expense share for the loan
  const bobToAliceLoanShares = await db
    .select()
    .from(expenseShare)
    .where(
      and(
        eq(expenseShare.payerUserId, aliceId),
        eq(expenseShare.participantUserId, bobId),
        isNull(expenseShare.groupId),
        eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN)
      )
    );

  if (bobToAliceLoanShares.length > 0) {
    const bobToAliceLoanShare = bobToAliceLoanShares[0];

    // Verify loan share data is valid before proceeding
    if (!bobToAliceLoanShare || !bobToAliceLoanShare.id) {
      console.error("Invalid loan share data for Bob to Alice");
      return;
    }

    // Create settlement transaction
    const bobToAliceSettlementTx = await createTransaction(
      bobId,
      "Partial Loan Repayment to Alice",
      bobToAliceSettlementDate
    );

    if (bobToAliceSettlementTx) {
      // Create entries for settlement
      await createTransactionEntries(bobToAliceSettlementTx.id, [
        {
          accountId: bobAccounts.loanTaken.id,
          amount: -bobToAliceSettlementAmount,
          date: bobToAliceSettlementDate,
        },
        {
          accountId: aliceAccounts.loanGiven.id,
          amount: bobToAliceSettlementAmount,
          date: bobToAliceSettlementDate,
        },
      ]);

      // Create settlement record
      const bobToAliceSettlement = await createSettlementRecord(
        bobId,
        aliceId,
        null,
        bobToAliceSettlementTx.id,
        bobToAliceSettlementAmount,
        "bob-alice-partial-repayment",
        bobToAliceSettlementDate
      );

      if (bobToAliceSettlement) {
        // Create settlement application
        await db.insert(settlementApplication).values({
          settlementId: bobToAliceSettlement.id,
          expenseShareId: bobToAliceLoanShare.id,
          appliedAmount: bobToAliceSettlementAmount,
          createdAt: bobToAliceSettlementDate,
          // Settlement application schema doesn't have updatedAt
        });

        // Update expense share
        await db
          .update(expenseShare)
          .set({
            paidAmount: bobToAliceSettlementAmount,
            status: EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
            updatedAt: bobToAliceSettlementDate,
          })
          .where(eq(expenseShare.id, bobToAliceLoanShare.id));

        // Update user balances
        await db
          .update(userBalance)
          .set({
            amount: Number(userBalance.amount) - bobToAliceSettlementAmount,
            updatedAt: bobToAliceSettlementDate,
          })
          .where(
            and(
              eq(userBalance.ownerId, aliceId),
              eq(userBalance.counterPartyId, bobId),
              isNull(userBalance.groupId)
            )
          );

        await db
          .update(userBalance)
          .set({
            amount: Number(userBalance.amount) + bobToAliceSettlementAmount,
            updatedAt: bobToAliceSettlementDate,
          })
          .where(
            and(
              eq(userBalance.ownerId, bobId),
              eq(userBalance.counterPartyId, aliceId),
              isNull(userBalance.groupId)
            )
          );
      }
    }
  } else {
    console.error("Could not find loan from Alice to Bob");
  }

  // Check if required accounts exist for Diana to Charlie full settlement
  if (!dianaAccounts.loanTaken || !charlieAccounts.loanGiven) {
    console.error("Missing required accounts for Diana to Charlie settlement");
    return;
  }

  // Diana fully pays back Charlie ($350 personal loan)
  const dianaToCharlieSettlementDate = new Date(2025, 1, 8); // February 8, 2025
  const dianaToCharlieSettlementAmount = 350;

  // Find the expense share for the loan
  const dianaToCharlieLoanShares = await db
    .select()
    .from(expenseShare)
    .where(
      and(
        eq(expenseShare.payerUserId, charlieId),
        eq(expenseShare.participantUserId, dianaId),
        isNull(expenseShare.groupId),
        eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN)
      )
    );

  if (dianaToCharlieLoanShares.length > 0) {
    const dianaToCharlieLoanShare = dianaToCharlieLoanShares[0];

    // Verify loan share data is valid before proceeding
    if (!dianaToCharlieLoanShare || !dianaToCharlieLoanShare.id) {
      console.error("Invalid loan share data for Diana to Charlie");
      return;
    }

    // Create settlement transaction
    const dianaToCharlieSettlementTx = await createTransaction(
      dianaId,
      "Full Loan Repayment to Charlie",
      dianaToCharlieSettlementDate
    );

    if (dianaToCharlieSettlementTx) {
      // Create entries for settlement
      await createTransactionEntries(dianaToCharlieSettlementTx.id, [
        {
          accountId: dianaAccounts.loanTaken.id,
          amount: -dianaToCharlieSettlementAmount,
          date: dianaToCharlieSettlementDate,
        },
        {
          accountId: charlieAccounts.loanGiven.id,
          amount: dianaToCharlieSettlementAmount,
          date: dianaToCharlieSettlementDate,
        },
      ]);

      // Create settlement record
      const dianaToCharlieSettlement = await createSettlementRecord(
        dianaId,
        charlieId,
        null,
        dianaToCharlieSettlementTx.id,
        dianaToCharlieSettlementAmount,
        "diana-charlie-full-repayment",
        dianaToCharlieSettlementDate
      );

      if (dianaToCharlieSettlement) {
        // Create settlement application
        await db.insert(settlementApplication).values({
          settlementId: dianaToCharlieSettlement.id,
          expenseShareId: dianaToCharlieLoanShare.id,
          appliedAmount: dianaToCharlieSettlementAmount,
          createdAt: dianaToCharlieSettlementDate,
          // Settlement application schema doesn't have updatedAt
        });

        // Update expense share
        await db
          .update(expenseShare)
          .set({
            paidAmount: dianaToCharlieSettlementAmount,
            status: EXPENSE_SHARE_STATUS.PAID,
            updatedAt: dianaToCharlieSettlementDate,
          })
          .where(eq(expenseShare.id, dianaToCharlieLoanShare.id));

        // Update user balances to zero since this is a full payment
        await db
          .update(userBalance)
          .set({
            amount: 0, // Full repayment, balance is zero
            updatedAt: dianaToCharlieSettlementDate,
          })
          .where(
            and(
              eq(userBalance.ownerId, charlieId),
              eq(userBalance.counterPartyId, dianaId),
              isNull(userBalance.groupId)
            )
          );

        await db
          .update(userBalance)
          .set({
            amount: 0, // Full repayment, balance is zero
            updatedAt: dianaToCharlieSettlementDate,
          })
          .where(
            and(
              eq(userBalance.ownerId, dianaId),
              eq(userBalance.counterPartyId, charlieId),
              isNull(userBalance.groupId)
            )
          );
      }
    }
  } else {
    console.error("Could not find loan from Charlie to Diana");
  }
}

// Create budgets for each user
async function createBudgets(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>
) {
  if (!Array.isArray(users)) {
    console.error("Users array is not valid");
    return;
  }

  for (const user of users) {
    if (!user || !user.id) {
      console.error("Invalid user object");
      continue;
    }

    const accounts = accountsByUser[user.id];

    if (!accounts) {
      console.error(`No accounts found for user: ${user.id}`);
      continue;
    }

    // Budget for groceries
    if (accounts.groceries) {
      await db.insert(budget).values({
        userId: user.id,
        transactionAccountId: accounts.groceries.id, // This maps to transasction_account_id in DB (note the typo in schema)
        amount: 500, // $500 budget
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Budget for dining out
    if (accounts.dining) {
      await db.insert(budget).values({
        userId: user.id,
        transactionAccountId: accounts.dining.id, // This maps to transasction_account_id in DB (note the typo in schema)
        amount: 300, // $300 budget
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Budget for entertainment
    if (accounts.entertainment) {
      await db.insert(budget).values({
        userId: user.id,
        transactionAccountId: accounts.entertainment.id, // This maps to transasction_account_id in DB (note the typo in schema)
        amount: 200, // $200 budget
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

// Create recurring items for each user
async function createRecurringItems(
  users: CreatedUser[],
  accountsByUser: Record<number, UserAccounts>
) {
  if (!Array.isArray(users)) {
    console.error("Users array is not valid");
    return;
  }

  for (const user of users) {
    if (!user || !user.id) {
      console.error("Invalid user object");
      continue;
    }

    const accounts = accountsByUser[user.id];

    if (!accounts) {
      console.error(`No accounts found for user: ${user.id}`);
      continue;
    }

    // Recurring income
    if (accounts.external && accounts.income) {
      await db.insert(recurring).values({
        userId: user.id,
        description: "Monthly Salary",
        amount: 5000, // $5000
        period: TIME_PERIOD.MONTHLY,
        type: RECURRENCE_TYPE.CREDIT, // Income is a credit
        sourceTransactionAccountID: accounts.external.id, // Match the field name in schema
        targetTransactionAccountID: accounts.income.id, // Match the field name in schema
        nextDate: new Date(2025, 1, 15), // February 15, 2025
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Recurring saving
    if (accounts.outgoing && accounts.saving) {
      await db.insert(recurring).values({
        userId: user.id,
        description: "Monthly Savings",
        amount: 1000, // $1000
        period: TIME_PERIOD.MONTHLY,
        type: RECURRENCE_TYPE.DEBIT, // Saving is a debit
        sourceTransactionAccountID: accounts.outgoing.id, // Match the field name in schema
        targetTransactionAccountID: accounts.saving.id, // Match the field name in schema
        nextDate: new Date(2025, 1, 25), // February 25, 2025
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
