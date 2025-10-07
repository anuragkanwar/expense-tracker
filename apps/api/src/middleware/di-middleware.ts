import { createMiddleware } from "hono/factory";
import { container } from "@/container";

export type InjectedServices = {
  authService: import("@/services/auth-service").AuthService;
  balanceService: import("@/services/balance-service").BalanceService;
  budgetService: import("@/services/budget-service").BudgetService;
  connectionService: import("@/services/connection-service").ConnectionService;
  dashboardService: import("@/services/dashboard-service").DashboardService;
  friendService: import("@/services/friend-service").FriendService;
  groupMemberRepository: import("@/repositories/group-member-repository").GroupMemberRepository;
  groupMemberService: import("@/services/group-member-service").GroupMemberService;
  groupService: import("@/services/group-service").GroupService;
  interpersonalDebtEngine: import("@/services/interpersonal-debt-engine").InterpersonalDebtEngine;
  loanService: import("@/services/loan-service").LoanService;
  passbookService: import("@/services/passbook-service").PassbookService;
  recurringService: import("@/services/recurring-service").RecurringService;
  settlementService: import("@/services/settlement-service").SettlementService;
  transactionAccountService: import("@/services/transaction-account-service").TransactionAccountService;
  transactionService: import("@/services/transaction-service").TransactionService;
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

  c.set("services", services);
  await next();
});
