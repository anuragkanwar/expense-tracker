import { createContainer, asClass, asValue, Lifetime } from "awilix";
import {
  AccountRepository,
  BalanceRepository,
  BudgetRepository,
  ConnectionRepository,
  DashboardRepository,
  ExpensePayerRepository,
  ExpenseSplitRepository,
  ExpenseRepository,
  FriendRepository,
  GroupRepository,
  GroupMemberRepository,
  PassbookRepository,
  RecurringRepository,
  SettlementRepository,
  TransactionAccountRepository,
  TransactionEntryRepository,
  TransactionRepository,
  UserRepository,
} from "./repositories";
import {
  AuthService,
  TransactionAccountService,
  BalanceService,
  BudgetService,
  ConnectionService,
  DashboardService,
  ExpenseService,
  FriendService,
  GroupService,
  GroupMemberService,
  PassbookService,
  RecurringService,
  SettlementService,
  TransactionHelperService,
  UserService,
} from "./services";
import { db } from "@/db";

const container = createContainer();

container.register({
  db: asValue(db),
});

container.register({
  // Repositories
  accountRepository: asClass(AccountRepository, { lifetime: Lifetime.SCOPED }),
  balanceRepository: asClass(BalanceRepository, { lifetime: Lifetime.SCOPED }),
  budgetRepository: asClass(BudgetRepository, { lifetime: Lifetime.SCOPED }),
  connectionRepository: asClass(ConnectionRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  dashboardRepository: asClass(DashboardRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  expensePayerRepository: asClass(ExpensePayerRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  expenseSplitRepository: asClass(ExpenseSplitRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  expenseRepository: asClass(ExpenseRepository, { lifetime: Lifetime.SCOPED }),
  friendRepository: asClass(FriendRepository, { lifetime: Lifetime.SCOPED }),
  groupRepository: asClass(GroupRepository, { lifetime: Lifetime.SCOPED }),
  groupMemberRepository: asClass(GroupMemberRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  settlementRepository: asClass(SettlementRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  passbookRepository: asClass(PassbookRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  recurringRepository: asClass(RecurringRepository, {
    lifetime: Lifetime.SCOPED,
  }),

  transactionAccountRepository: asClass(TransactionAccountRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  transactionEntryRepository: asClass(TransactionEntryRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  transactionRepository: asClass(TransactionRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  userRepository: asClass(UserRepository, { lifetime: Lifetime.SCOPED }),

  // Services
  authService: asClass(AuthService, { lifetime: Lifetime.SCOPED }),
  transactionAccountService: asClass(TransactionAccountService, {
    lifetime: Lifetime.SCOPED,
  }),
  balanceService: asClass(BalanceService, { lifetime: Lifetime.SCOPED }),
  budgetService: asClass(BudgetService, { lifetime: Lifetime.SCOPED }),
  connectionService: asClass(ConnectionService, { lifetime: Lifetime.SCOPED }),
  dashboardService: asClass(DashboardService, { lifetime: Lifetime.SCOPED }),
  expenseService: asClass(ExpenseService, { lifetime: Lifetime.SCOPED }).inject(
    () => ({
      balanceRepository: container.resolve("balanceRepository"),
      db: container.resolve("db"),
      expensePayerRepository: container.resolve("expensePayerRepository"),
      expenseRepository: container.resolve("expenseRepository"),
      expenseSplitRepository: container.resolve("expenseSplitRepository"),
      groupMemberRepository: container.resolve("groupMemberRepository"),
      groupRepository: container.resolve("groupRepository"),
      transactionAccountRepository: container.resolve(
        "transactionAccountRepository"
      ),
      transactionEntryRepository: container.resolve(
        "transactionEntryRepository"
      ),
      transactionRepository: container.resolve("transactionRepository"),
      transactionHelperService: container.resolve("transactionHelperService"),
      friendService: container.resolve("friendService"),
    })
  ),
  friendService: asClass(FriendService, { lifetime: Lifetime.SCOPED }),
  groupService: asClass(GroupService, { lifetime: Lifetime.SCOPED }),
  groupMemberService: asClass(GroupMemberService, {
    lifetime: Lifetime.SCOPED,
  }),
  transactionHelperService: asClass(TransactionHelperService, {
    lifetime: Lifetime.SCOPED,
  }),
  settlementService: asClass(SettlementService, {
    lifetime: Lifetime.SCOPED,
  }),
  passbookService: asClass(PassbookService, { lifetime: Lifetime.SCOPED }),
  recurringService: asClass(RecurringService, { lifetime: Lifetime.SCOPED }),
  userService: asClass(UserService, { lifetime: Lifetime.SCOPED }),
});

export { container };
