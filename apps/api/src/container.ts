import { createContainer, asClass, asValue, Lifetime } from "awilix";
import {
  AccountRepository,
  BalanceRepository,
  BudgetRepository,
  ConnectionRepository,
  DashboardRepository,
  LoanPayerRepository,
  LoanSplitsRepository,
  LoanRepository,
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
  ExpenseShareRepository,
  SettlementApplicationRepository,
} from "./repositories";
import {
  AuthService,
  TransactionAccountService,
  BalanceService,
  BudgetService,
  ConnectionService,
  DashboardService,
  LoanService,
  FriendService,
  GroupService,
  GroupMemberService,
  PassbookService,
  RecurringService,
  SettlementService,
  TransactionHelperService,
  TransactionService,
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
  loanPayerRepository: asClass(LoanPayerRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  loanSplitsRepository: asClass(LoanSplitsRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  loanRepository: asClass(LoanRepository, { lifetime: Lifetime.SCOPED }),
  friendRepository: asClass(FriendRepository, { lifetime: Lifetime.SCOPED }),
  groupRepository: asClass(GroupRepository, { lifetime: Lifetime.SCOPED }),
  groupMemberRepository: asClass(GroupMemberRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  settlementRepository: asClass(SettlementRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  expenseShareRepository: asClass(ExpenseShareRepository, {
    lifetime: Lifetime.SCOPED,
  }),
  settlementApplicationRepository: asClass(SettlementApplicationRepository, {
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
  loanService: asClass(LoanService, { lifetime: Lifetime.SCOPED }).inject(
    () => ({
      transactionService: container.resolve("transactionService"),
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
  transactionService: asClass(TransactionService, {
    lifetime: Lifetime.SCOPED,
  }),
  balanceAdjustmentService: asClass(
    // direct import to maintain tree-shaking and TS type safety
    (await import("./services/balance-adjustment-service"))
      .BalanceAdjustmentService,
    {
      lifetime: Lifetime.SCOPED,
    }
  ),
  settlementService: asClass(SettlementService, {
    lifetime: Lifetime.SCOPED,
  }),
  passbookService: asClass(PassbookService, { lifetime: Lifetime.SCOPED }),
  recurringService: asClass(RecurringService, { lifetime: Lifetime.SCOPED }),
  userService: asClass(UserService, { lifetime: Lifetime.SCOPED }),
});

export { container };
