import { container } from "@/container";
import { InjectedServices } from "@/middleware/di-middleware";
import {
  ACCOUNT_TYPE,
  FRIEND_STATUS,
  RECURRENCE_TYPE,
  TIME_PERIOD,
  TXN_TYPE,
  SHARE_TYPE,
  SPLIT_TYPE,
  TXN_CATEGORY,
  EXPENSE_SHARE_TYPE,
} from "@pocket-pixie/db-schema";
import { db, expenseShare } from "@/db";
import { and, eq } from "drizzle-orm";
import type { UserAuth } from "@pocket-pixie/contracts";

interface UserWithPassword {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

interface CreatedUser extends UserWithPassword {
  id: number;
}

// Helper function to convert CreatedUser to UserAuth
function createdUserToAuth(user: CreatedUser): UserAuth {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    currency: user.currency || "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true,
  };
}

export async function seedComprehensive() {
  console.log("Starting comprehensive seed with services...");

  const scope = container.createScope();
  const services: InjectedServices = {
    authService: scope.resolve("authService"),
    balanceService: scope.resolve("balanceService"),
    budgetService: scope.resolve("budgetService"),
    connectionService: scope.resolve("connectionService"),
    dashboardService: scope.resolve("dashboardService"),
    friendService: scope.resolve("friendService"),
    groupMemberRepository: scope.resolve("groupMemberRepository"),
    groupMemberService: scope.resolve("groupMemberService"),
    groupService: scope.resolve("groupService"),
    interpersonalDebtEngine: scope.resolve("interpersonalDebtEngine"),
    loanService: scope.resolve("loanService"),
    passbookService: scope.resolve("passbookService"),
    recurringService: scope.resolve("recurringService"),
    settlementService: scope.resolve("settlementService"),
    transactionAccountService: scope.resolve("transactionAccountService"),
    transactionService: scope.resolve("transactionService"),
    userService: scope.resolve("userService"),
  };

  // Cleanup (Be careful with this in production!)
  console.log("Cleaning up existing data...");
  await cleanupExistingData(services);

  // Create 4 users
  console.log("Creating users...");
  const users = await createUsers(services, [
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
  await createFriendships(services, users);

  // Create 2 groups
  console.log("Creating groups...");
  const groups = (await createGroups(services, users)) || [];

  // Create personal transactions for each user
  console.log("Creating personal transactions...");
  await createPersonalTransactions(services, users);

  // Create shared expenses
  console.log("Creating shared expenses...");
  await createSharedExpenses(services, users, groups);

  // Create direct loans (person to person)
  console.log("Creating direct loans...");
  await createDirectLoans(services, users);

  // --- VERIFICATION STEP ---
  console.log("--- VERIFYING OBLIGATIONS BEFORE SETTLEMENT ---");
  const [alice, bob] = users;
  if (alice && bob) {
    const directLoanShares = await db
      .select()
      .from(expenseShare)
      .where(
        and(
          eq(expenseShare.type, EXPENSE_SHARE_TYPE.LOAN),
          eq(expenseShare.payerUserId, alice.id),
          eq(expenseShare.participantUserId, bob.id)
        )
      );
    console.log(
      "Found direct loan shares from Alice to Bob:",
      directLoanShares
    );
    if (directLoanShares.length === 0) {
      console.error(
        "CRITICAL: No direct loan from Alice to Bob found before settlement."
      );
    }
  } else {
    console.error("Alice or Bob not found for verification step.");
  }
  console.log("--- VERIFICATION END ---");

  // Create group loans
  // console.log("Creating group loans...");
  // await createGroupLoans(services, users, groups);

  // Create settlements (partial and full payments)
  console.log("Creating settlements...");
  await createSettlements(services, users, groups);

  // Create budgets
  console.log("Creating budgets...");
  await createBudgets(services, users);

  // Create recurring items
  console.log("Creating recurring items...");
  await createRecurringItems(services, users);

  console.log("Comprehensive seed with services completed successfully!");
  return 0;
}

async function cleanupExistingData(services: InjectedServices) {
  // This is a bit tricky as we don't have a service to truncate the database.
  // We will continue to use the direct db access for this.
  const { db } = container.cradle;
  const {
    settlementApplication,
    settlement,
    expenseShare,
    userBalance,
    recurring,
    budget,
    transactionEntry,
    transaction,
    transactionAccount,
    groupMember,
    group,
    friendship,
    user,
  } = await import("@pocket-pixie/db-schema");

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
  await db.delete(user);
}

async function createUsers(
  services: InjectedServices,
  userData: UserWithPassword[]
): Promise<CreatedUser[]> {
  const createdUsers: CreatedUser[] = [];

  for (const data of userData) {
    try {
      const response = await services.authService.signUp({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const userId = Number(response.response.user.id);

      if (!userId) {
        throw new Error(`Failed to get ID for user: ${data.email}`);
      }

      createdUsers.push({ id: userId, ...data });

      console.log(`Created user ${data.name} with ID ${userId}`);
    } catch (error) {
      console.error(`Failed to create user ${data.email}:`, error);
      throw error;
    }
  }

  return createdUsers;
}

async function createFriendships(
  services: InjectedServices,
  users: CreatedUser[]
) {
  for (let i = 0; i < users.length; i++) {
    const user1 = users[i];
    if (!user1 || !user1.id) continue;

    for (let j = i + 1; j < users.length; j++) {
      const user2 = users[j];
      if (!user2 || !user2.id) continue;

      await services.friendService.sendFriendRequest(
        createdUserToAuth(user1),
        user2.id
      );
      await services.friendService.respondToFriendRequest(
        createdUserToAuth(user2),
        user1.id,
        "accept"
      );
    }
  }
}

async function createGroups(services: InjectedServices, users: CreatedUser[]) {
  if (users.length < 4) {
    throw new Error("Need at least 4 users to create groups");
  }

  const [alice, bob, charlie, diana] = users;

  if (!alice || !bob || !charlie || !diana) return;
  const group1 = await services.groupService.createGroup({
    name: "Roommates",
    createdBy: alice.id,
    coverPhotoURL: "https://picsum.photos/seed/roommates/200/300",
  });

  await services.groupService.addGroupMembersBulk(alice.id, group1.id, [
    bob.id,
    charlie.id,
  ]);

  const group2 = await services.groupService.createGroup({
    name: "Travel Buddies",
    createdBy: bob.id,
    coverPhotoURL: "https://picsum.photos/seed/travel/200/300",
  });

  await services.groupService.addGroupMembersBulk(bob.id, group2.id, [
    charlie.id,
    diana.id,
  ]);

  return [group1, group2];
}

async function createPersonalTransactions(
  services: InjectedServices,
  users: CreatedUser[]
) {
  for (const user of users) {
    const accounts = await services.transactionAccountService.getAll(
      createdUserToAuth(user)
    );
    const incomeAccount = accounts.find((a) => a.type === ACCOUNT_TYPE.INCOME);
    const externalAccount = accounts.find(
      (a) => a.type === ACCOUNT_TYPE.EXTERNAL
    );
    const groceriesAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.GROCERIES
    );
    const diningAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.DINING_OUT
    );
    const entertainmentAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.ENTERTAINMENT
    );
    const savingAccount = accounts.find((a) => a.type === ACCOUNT_TYPE.SAVING);
    const outgoingAccount = accounts.find(
      (a) => a.type === ACCOUNT_TYPE.OUTGOING
    );

    if (
      !incomeAccount ||
      !externalAccount ||
      !groceriesAccount ||
      !diningAccount ||
      !entertainmentAccount ||
      !savingAccount ||
      !outgoingAccount
    ) {
      console.error(
        `Skipping personal transactions for user ${user.id} due to missing accounts`
      );
      continue;
    }

    const expenseCategories = [
      {
        account: groceriesAccount,
        desc: "Grocery Shopping",
        min: 40,
        max: 150,
      },
      { account: diningAccount, desc: "Dining Out", min: 15, max: 80 },
      {
        account: entertainmentAccount,
        desc: "Entertainment",
        min: 20,
        max: 100,
      },
    ];

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      // Income
      await services.transactionService.createTransaction({
        description: "Monthly Salary",
        payer: user.id,
        amount: Math.floor(Math.random() * 1000) + 4500,
        type: TXN_TYPE.INCOME,
        sourceTransactionAccountID: externalAccount.id,
        targetTransactionAccountID: incomeAccount.id,
        sharedWith: SHARE_TYPE.NONE,
      });

      // Saving
      await services.transactionService.createTransaction({
        description: "Monthly Savings",
        payer: user.id,
        amount: Math.floor(Math.random() * 400) + 800,
        type: TXN_TYPE.SAVING,
        sourceTransactionAccountID: outgoingAccount.id,
        targetTransactionAccountID: savingAccount.id,
        sharedWith: SHARE_TYPE.NONE,
      });

      // Expenses
      for (let i = 0; i < 18; i++) {
        const cat =
          expenseCategories[
            Math.floor(Math.random() * expenseCategories.length)
          ]!;
        const amount =
          Math.floor(Math.random() * (cat.max - cat.min + 1)) + cat.min;
        await services.transactionService.createTransaction({
          description: cat.desc,
          payer: user.id,
          amount,
          type: TXN_TYPE.EXPENSE,
          sourceTransactionAccountID: outgoingAccount.id,
          targetTransactionAccountID: cat.account.id,
          sharedWith: SHARE_TYPE.NONE,
        });
      }
    }
  }
}

async function createSharedExpenses(
  services: InjectedServices,
  users: CreatedUser[],
  groups: any[]
) {
  const [alice, bob, charlie, diana] = users;

  if (!alice || !bob || !charlie || !diana) return;

  const [roommates, travelBuddies] = groups;

  const aliceAccounts = await services.transactionAccountService.getAll(
    createdUserToAuth(alice)
  );
  const aliceOutgoingAccount = aliceAccounts.find(
    (a) => a.type === ACCOUNT_TYPE.OUTGOING
  );
  const aliceEntertainmentAccount = aliceAccounts.find(
    (a) => a.name === TXN_CATEGORY.ENTERTAINMENT
  );

  if (!aliceOutgoingAccount || !aliceEntertainmentAccount) {
    console.error("Skipping shared expenses for Alice due to missing accounts");
    return;
  }

  // Alice pays for utilities that will be split among roommates
  await services.transactionService.createTransaction(
    {
      description: "Monthly Utilities",
      payer: alice.id,
      amount: 300,
      type: TXN_TYPE.EXPENSE,
      sourceTransactionAccountID: aliceOutgoingAccount.id,
      targetTransactionAccountID: aliceEntertainmentAccount.id,
      sharedWith: SHARE_TYPE.GROUP,
      groupId: roommates.id,
      splitType: SPLIT_TYPE.EQUAL,
      splits: [
        { userId: bob.id, amount: 100 },
        { userId: charlie.id, amount: 100 },
      ],
    },
    "USD"
  );

  const bobAccounts = await services.transactionAccountService.getAll(
    createdUserToAuth(bob)
  );
  const bobOutgoingAccount = bobAccounts.find(
    (a) => a.type === ACCOUNT_TYPE.OUTGOING
  );
  const bobEntertainmentAccount = bobAccounts.find(
    (a) => a.name === TXN_CATEGORY.ENTERTAINMENT
  );

  if (!bobOutgoingAccount || !bobEntertainmentAccount) {
    console.error("Skipping shared expenses for Bob due to missing accounts");
    return;
  }

  // Bob pays for hotel that will be split among travel buddies
  await services.transactionService.createTransaction(
    {
      description: "Hotel for Weekend Trip",
      payer: bob.id,
      amount: 600,
      type: TXN_TYPE.EXPENSE,
      sourceTransactionAccountID: bobOutgoingAccount.id,
      targetTransactionAccountID: bobEntertainmentAccount.id,
      sharedWith: SHARE_TYPE.GROUP,
      groupId: travelBuddies.id,
      splitType: SPLIT_TYPE.EQUAL,
      splits: [
        { userId: charlie.id, amount: 200 },
        { userId: diana.id, amount: 200 },
      ],
    },
    "USD"
  );
}

async function createDirectLoans(
  services: InjectedServices,
  users: CreatedUser[]
) {
  const [alice, bob, charlie, diana] = users;
  if (!alice || !bob || !charlie || !diana) return;
  // Alice lends $500 to Bob
  await services.loanService.createLoanDirect(
    {
      creditorId: alice.id,
      debtorId: bob.id,
      amount: 500,
      currency: "USD",
      description: "Personal Loan to Bob",
    },
    alice.id
  );

  // Charlie lends $350 to Diana
  await services.loanService.createLoanDirect(
    {
      creditorId: charlie.id,
      debtorId: diana.id,
      amount: 350,
      currency: "USD",
      description: "Personal Loan to Diana",
    },
    charlie.id
  );
}

// async function createGroupLoans(
//   services: InjectedServices,
//   users: CreatedUser[],
//   groups: any[]
// ) {
//   const [alice, , charlie] = users;
//   if (!alice || !charlie)
//     return;
//   const [roommates] = groups;
//
//   // Alice lends $300 to Charlie in Roommates group
//   await services.loanService.createLoanDirect(
//     {
//       creditorId: alice.id,
//       debtorId: charlie.id,
//       amount: 300,
//       currency: "USD",
//       description: "Group Loan to Charlie for Rent",
//       groupId: roommates.id,
//     },
//     alice.id
//   );
// }

async function createSettlements(
  services: InjectedServices,
  users: CreatedUser[],
  groups: any[]
) {
  const [alice, bob, charlie, diana] = users;
  if (!alice || !bob || !charlie || !diana) return;

  const [roommates, travelBuddies] = groups;

  // --- Direct Loan Settlements ---
  // Bob partially pays back Alice ($200 out of $500 personal loan)
  await services.settlementService.allocateLoanSettlement({
    payerId: bob.id,
    payeeId: alice.id,
    amount: 200,
    currency: "USD",
  });

  // Diana fully pays back Charlie ($350 personal loan)
  await services.settlementService.allocateLoanSettlement({
    payerId: diana.id,
    payeeId: charlie.id,
    amount: 350,
    currency: "USD",
  });

  // --- Group Expense Settlements ---

  // Charlie pays back his share of utilities to Alice in the "Roommates" group
  await services.settlementService.allocateExpenseShareSettlement({
    payerId: charlie.id,
    payeeId: alice.id,
    amount: 100,
    currency: "USD",
    groupId: roommates.id,
  });

  // Diana partially pays back her share of the hotel to Bob in the "Travel Buddies" group
  await services.settlementService.allocateExpenseShareSettlement({
    payerId: diana.id,
    payeeId: bob.id,
    amount: 150,
    currency: "USD",
    groupId: travelBuddies.id,
  });
}

async function createBudgets(services: InjectedServices, users: CreatedUser[]) {
  for (const user of users) {
    const accounts = await services.transactionAccountService.getAll(
      createdUserToAuth(user)
    );
    const groceriesAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.GROCERIES
    );
    const diningAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.DINING_OUT
    );
    const entertainmentAccount = accounts.find(
      (a) => a.name === TXN_CATEGORY.ENTERTAINMENT
    );

    if (groceriesAccount) {
      await services.budgetService.createBudget({
        userId: user.id,
        transactionAccountId: groceriesAccount.id,
        amount: 500,
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date().toISOString(),
      });
    }

    if (diningAccount) {
      await services.budgetService.createBudget({
        userId: user.id,
        transactionAccountId: diningAccount.id,
        amount: 300,
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date().toISOString(),
      });
    }

    if (entertainmentAccount) {
      await services.budgetService.createBudget({
        userId: user.id,
        transactionAccountId: entertainmentAccount.id,
        amount: 200,
        period: TIME_PERIOD.MONTHLY,
        startDate: new Date().toISOString(),
      });
    }
  }
}

async function createRecurringItems(
  services: InjectedServices,
  users: CreatedUser[]
) {
  for (const user of users) {
    // Recurring income
    await services.recurringService.createRecurringItemWithResolution(
      user.id,
      {
        description: "Monthly Salary",
        amount: 5000,
        period: TIME_PERIOD.MONTHLY,
        nextDate: new Date(2025, 1, 15).toISOString(),
        type: RECURRENCE_TYPE.CREDIT,
      },
      RECURRENCE_TYPE.CREDIT
    );

    // Recurring saving
    await services.recurringService.createRecurringItemWithResolution(
      user.id,
      {
        description: "Monthly Savings",
        amount: 1000,
        period: TIME_PERIOD.MONTHLY,
        nextDate: new Date(2025, 1, 25).toISOString(),
        type: RECURRENCE_TYPE.DEBIT,
      },
      RECURRENCE_TYPE.DEBIT,
      undefined,
      ACCOUNT_TYPE.SAVING
    );
  }
}
