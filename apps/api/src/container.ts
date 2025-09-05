import { createContainer, asClass, asValue, Lifetime } from "awilix";
import {
  StudentRepository,
  AccountRepository,
  BalanceRepository,
  BudgetRepository,
  CategoryRepository,
  ConnectionRepository,
  DashboardRepository,
  ExpensePayerRepository,
  ExpenseSplitRepository,
  ExpenseRepository,
  FriendRepository,
  GroupRepository,
  PassbookRepository,
  RecurringRepository,
  TransactionAccountRepository,
  TransactionEntryRepository,
  TransactionRepository,
  UserRepository,
} from "./repositories";
import {
  StudentService,
  AccountService,
  BalanceService,
  BudgetService,
  CategoryService,
  ConnectionService,
  DashboardService,
  ExpenseService,
  FriendService,
  GroupService,
  PassbookService,
  RecurringService,
  UserService,
} from "./services";
import { db } from "@pocket-pixie/db";

const container = createContainer();

container.register({
  db: asValue(db),
});

container.register({
  // Repositories
  studentRepository: asClass(StudentRepository, { lifetime: Lifetime.SCOPED }),
  accountRepository: asClass(AccountRepository, { lifetime: Lifetime.SCOPED }),
  balanceRepository: asClass(BalanceRepository, { lifetime: Lifetime.SCOPED }),
  budgetRepository: asClass(BudgetRepository, { lifetime: Lifetime.SCOPED }),
  categoryRepository: asClass(CategoryRepository, {
    lifetime: Lifetime.SCOPED,
  }),
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
  studentService: asClass(StudentService, { lifetime: Lifetime.SCOPED }),
  accountService: asClass(AccountService, { lifetime: Lifetime.SCOPED }),
  balanceService: asClass(BalanceService, { lifetime: Lifetime.SCOPED }),
  budgetService: asClass(BudgetService, { lifetime: Lifetime.SCOPED }),
  categoryService: asClass(CategoryService, { lifetime: Lifetime.SCOPED }),
  connectionService: asClass(ConnectionService, { lifetime: Lifetime.SCOPED }),
  dashboardService: asClass(DashboardService, { lifetime: Lifetime.SCOPED }),
  expenseService: asClass(ExpenseService, { lifetime: Lifetime.SCOPED }),
  friendService: asClass(FriendService, { lifetime: Lifetime.SCOPED }),
  groupService: asClass(GroupService, { lifetime: Lifetime.SCOPED }),
  passbookService: asClass(PassbookService, { lifetime: Lifetime.SCOPED }),
  recurringService: asClass(RecurringService, { lifetime: Lifetime.SCOPED }),
  userService: asClass(UserService, { lifetime: Lifetime.SCOPED }),
});

export { container };
