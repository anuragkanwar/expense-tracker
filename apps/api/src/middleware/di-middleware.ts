import { createMiddleware } from "hono/factory";
import { container } from "@/container";

export type InjectedServices = {
  authService: import("@/services/auth-service").AuthService;
  studentService: import("@/services/student-service").StudentService;
  transactionAccountService: import("@/services/transaction-account-service").TransactionAccountService;
  balanceService: import("@/services/balance-service").BalanceService;
  budgetService: import("@/services/budget-service").BudgetService;
  connectionService: import("@/services/connection-service").ConnectionService;
  dashboardService: import("@/services/dashboard-service").DashboardService;
  expenseService: import("@/services/expense-service").ExpenseService;
  friendService: import("@/services/friend-service").FriendService;
  groupService: import("@/services/group-service").GroupService;
  groupMemberService: import("@/services/group-member-service").GroupMemberService;
  settlementService: import("@/services/settlement-service").SettlementService;
  groupMemberRepository: import("@/repositories/group-member-repository").GroupMemberRepository;
  passbookService: import("@/services/passbook-service").PassbookService;
  recurringService: import("@/services/recurring-service").RecurringService;
  userService: import("@/services/user-service").UserService;
};

declare module "hono" {
  interface ContextVariableMap {
    services: InjectedServices;
  }
}

export const dependencyInjector = createMiddleware(async (c, next) => {
  const scope = container.createScope();

  const services: InjectedServices = {
    authService: scope.resolve("authService"),
    studentService: scope.resolve("studentService"),
    transactionAccountService: scope.resolve("transactionAccountService"),
    balanceService: scope.resolve("balanceService"),
    budgetService: scope.resolve("budgetService"),
    connectionService: scope.resolve("connectionService"),
    dashboardService: scope.resolve("dashboardService"),
    expenseService: scope.resolve("expenseService"),
    friendService: scope.resolve("friendService"),
    groupService: scope.resolve("groupService"),
    groupMemberService: scope.resolve("groupMemberService"),
    settlementService: scope.resolve("settlementService"),
    groupMemberRepository: scope.resolve("groupMemberRepository"),
    passbookService: scope.resolve("passbookService"),
    recurringService: scope.resolve("recurringService"),
    userService: scope.resolve("userService"),
  };

  c.set("services", services);
  await next();
});
