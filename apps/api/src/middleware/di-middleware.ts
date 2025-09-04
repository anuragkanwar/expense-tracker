import { createMiddleware } from "hono/factory";
import { container } from "@/container";

export type InjectedServices = {
  studentService: import("@/services/student-service").StudentService;
  accountService: import("@/services/account-service").AccountService;
  balanceService: import("@/services/balance-service").BalanceService;
  budgetService: import("@/services/budget-service").BudgetService;
  categoryService: import("@/services/category-service").CategoryService;
  connectionService: import("@/services/connection-service").ConnectionService;
  dashboardService: import("@/services/dashboard-service").DashboardService;
  expenseService: import("@/services/expense-service").ExpenseService;
  friendService: import("@/services/friend-service").FriendService;
  groupService: import("@/services/group-service").GroupService;
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
    studentService: scope.resolve("studentService"),
    accountService: scope.resolve("accountService"),
    balanceService: scope.resolve("balanceService"),
    budgetService: scope.resolve("budgetService"),
    categoryService: scope.resolve("categoryService"),
    connectionService: scope.resolve("connectionService"),
    dashboardService: scope.resolve("dashboardService"),
    expenseService: scope.resolve("expenseService"),
    friendService: scope.resolve("friendService"),
    groupService: scope.resolve("groupService"),
    passbookService: scope.resolve("passbookService"),
    recurringService: scope.resolve("recurringService"),
    userService: scope.resolve("userService"),
  };

  c.set("services", services);
  await next();
});
