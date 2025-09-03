Auth and user management :
POST /api/v1/auth/register Creates a new user account.
POST /api/v1/auth/login Authenticates a user and returns a JWT token.
POST /api/v1/auth/logout Logs out the current user and invalidates the token.
GET /api/v1/users/me Retrieves the profile of the currently authenticated user.
PUT /api/v1/users/me Updates the profile of the currently authenticated user.

Friend management
GET /api/v1/friends Returns a list of the current user's friends.
POST /api/v1/friends Sends a friend request to another user by email or user ID.
GET /api/v1/friends/requests Lists all pending friend requests for the current user.
PUT /api/v1/friends/requests/{userId} Accepts or rejects a pending friend request from a specific user.
DELETE /api/v1/friends/{userId} Removes a friend.

Group Management
POST /api/v1/groups Creates a new expense-sharing group.
GET /api/v1/groups Lists all groups the current user is a member of.
GET /api/v1/groups/{groupId} Retrieves detailed information about a specific group.
PUT /api/v1/groups/{groupId} Updates a group's details (e.g., name, cover photo).
DELETE /api/v1/groups/{groupId} Deletes a group.
GET /api/v1/groups/{groupId}/members Lists all members of a specific group.
POST /api/v1/groups/{groupId}/members Adds a new member to a group.
DELETE /api/v1/groups/{groupId}/members/{userId} Removes a member from a group.

Expense and transaction management
POST /api/v1/expenses Creates a new expense (can be group, F2F, or personal).
GET /api/v1/expenses Lists all expenses the current user is involved in (paginated).
GET /api/v1/expenses/{expenseId} Retrieves the details of a single expense.
PUT /api/v1/expenses/{expenseId} Updates an existing expense.
DELETE /api/v1/expenses/{expenseId} Deletes an expense.
GET /api/v1/groups/{groupId}/expenses Lists all expenses for a specific group.
GET /api/v1/friends/{userId}/expenses Lists all non-group expenses between the current user and a friend.

Balances and settlments
GET /api/v1/balances Gets the user's total balance (total owed vs. total owed to you).
GET /api/v1/balances/friends/{userId} Gets the total consolidated balance with a specific friend.
GET /api/v1/balances/groups/{groupId} Gets the user's net balance within a specific group.
POST /api/v1/settlements Records a payment to settle a debt (e.g., "I paid Jane $20").
GET /api/v1/settlements/simplify Gets a simplified payment plan for all of the user's debts.
GET /api/v1/settlements/groups/{groupId}/simplify Gets a simplified payment plan for a specific group.

Personal Finance: acconts, passbook, categories
GET /api/v1/passbook Retrieves a paginated list of all personal transactions (supports filtering).
GET /api/v1/accounts Lists all of the user's financial accounts (e.g., bank accounts, cash).
POST /api/v1/accounts Creates a new financial account (e.g., adding a new credit card).
GET /api/v1/accounts/{accountId} Retrieves details for a single financial account.
PUT /api/v1/accounts/{accountId} Updates a financial account.
DELETE /api/v1/accounts/{accountId} Deletes a financial account.
GET /api/v1/categories Lists all available transaction categories (both income and expense).
POST /api/v1/categories Creates a new custom category.
PUT /api/v1/categories/{categoryId} Updates a custom category.
DELETE /api/v1/categories/{categoryId} Deletes a custom category.

Personal Finance: budget and recurring items
GET /api/v1/budgets Lists all of the user's budgets.
POST /api/v1/budgets Creates a new budget for a specific category.
GET /api/v1/budgets/{budgetId} Retrieves details for a single budget.
PUT /api/v1/budgets/{budgetId} Updates a budget.
DELETE /api/v1/budgets/{budgetId} Deletes a budget.
GET /api/v1/recurring-items Lists all recurring items (income and expenses).
POST /api/v1/recurring-items Creates a new recurring item.
GET /api/v1/recurring-items/{itemId} Retrieves details for a single recurring item.
PUT /api/v1/recurring-items/{itemId} Updates a recurring item.
DELETE /api/v1/recurring-items/{itemId} Deletes a recurring item.

homepage dashboard
GET /api/v1/dashboard/monthly-summary Retrieves a consolidated summary for the current month's homepage.
GET /api/v1/dashboard/spending-by-category Gets a breakdown of spending by category for the current month.
GET /api/v1/dashboard/upcoming-bills Lists upcoming recurring expenses for the next 30 days.
GET /api/v1/dashboard/net-worth-trend Gets data points for a net worth trend line over the last 6-12 months.

Data aggregation
POST /api/v1/connections/link-token Generates a token to initiate the secure account linking flow.
POST /api/v1/connections/sync Manually triggers a data synchronization for linked accounts.
