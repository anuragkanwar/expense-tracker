# API Routes (Authoritative)

Legend:

- Canonical: Preferred, modern endpoint
- Legacy: Supported for backward compatibility; avoid for new clients
- Stub 501: Route defined but not yet implemented (returns 501)
- (Implicit) All endpoints require authentication unless noted
- Idempotency-Key: Required for settlement allocation creation
- All routes now use the unified schema implementation (debt tracking via expense_share table)

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
DELETE /api/v1/friends/{userId} Removes a friend or cancels a pending friend request.

Group Management
POST /api/v1/groups Creates a new expense-sharing group.
GET /api/v1/groups Lists all groups the current user is a member of.
GET /api/v1/groups/{groupId} Retrieves detailed information about a specific group.
PUT /api/v1/groups/{groupId} Updates a group's details (e.g., name, cover photo).
DELETE /api/v1/groups/{groupId} Deletes a group.
GET /api/v1/groups/{groupId}/members Lists all members of a specific group.
POST /api/v1/groups/{groupId}/members Adds one or more members to a group (supports both single and bulk addition).
DELETE /api/v1/groups/{groupId}/members/{userId} Removes a member from a group.

Transaction management (replaces legacy /expenses\*)
POST /api/v1/transactions Creates a new transaction (personal, shared, or loan entries as applicable)
GET /api/v1/transactions Lists transactions involving the user (pagination, optional type filter)
GET /api/v1/transactions/{transactionId} Get single transaction details
PUT /api/v1/transactions/{transactionId} Update editable fields (description, date, etc.)
DELETE /api/v1/transactions/{transactionId} Delete a transaction (subject to domain constraints)
GET /api/v1/groups/{groupId}/transactions List group-scoped transactions
GET /api/v1/friends/{userId}/transactions List bilateral (non-group) shared transactions
POST /api/v1/transactions/ai (Stub 501) Create transaction via AI prompt parsing (NOT IMPLEMENTED)

Loans
POST /api/v1/loans/symmetric Creates a direct bilateral loan; authenticated user is creditor lending to debtor; follows LOAN_GIVEN (-) → LOAN_TAKEN (+) accounting pattern. (Canonical path.)
GET /api/v1/loans Lists loans created by the user (future: participation filter).
GET /api/v1/loans/{loanId} Retrieves details of a loan (creator only currently).
PUT /api/v1/loans/{loanId} Updates a loan (description / date).
DELETE /api/v1/loans/{loanId} Deletes a loan.
GET /api/v1/groups/{groupId}/loans Lists loans within a specific group context. Returns loans where the authenticated user is either the creditor or debtor. Supports pagination via page/limit parameters and optional type filtering. Requires group membership.
GET /api/v1/friends/{friendId}/loans Lists loans between the authenticated user and a specific friend. Shows the complete bilateral loan history (money lent and borrowed) with the specified friend. Supports pagination. Requires active friendship.

Balances and settlements (Idempotent)
GET /api/v1/balances Gets the user's total balance (total owed vs. total owed to you).
GET /api/v1/balances/friends/{userId} Gets the total consolidated balance with a specific friend.
GET /api/v1/balances/groups/{groupId} Gets the user's net balance within a specific group.
GET /api/v1/balances/simplify Simplified global settlement suggestion.
GET /api/v1/balances/groups/{groupId}/simplify Simplified settlement suggestion within group.
POST /api/v1/settlements/allocate (Canonical) Allocate repayment across outstanding expense shares FIFO. **Idempotency-Key header REQUIRED**. Returns 200 for both new allocations and identical replays, 409 for payload conflicts.

Personal Finance: accounts, passbook
GET /api/v1/passbook Retrieves a paginated list of all personal transactions (supports filtering).
GET /api/v1/accounts Lists all of the user's financial accounts (e.g., bank accounts, cash).
POST /api/v1/accounts Creates a new financial account (e.g., adding a new credit card).
GET /api/v1/accounts/{accountId} Retrieves details for a single financial account.
PUT /api/v1/accounts/{accountId} Updates a financial account.
DELETE /api/v1/accounts/{accountId} Deletes a financial account.

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

Homepage dashboard & analytics
GET /api/v1/dashboard/monthly-summary Retrieves a consolidated summary for the current month's homepage.
GET /api/v1/dashboard/spending-by-category Gets a breakdown of spending by category for the current month.
GET /api/v1/dashboard/upcoming-bills Lists upcoming recurring expenses for the next 30 days.
GET /api/v1/dashboard/net-worth-trend Gets data points for a net worth trend line over the last 6-12 months.
GET /api/v1/dashboard/spending-analytics Spending analytics (new aggregated metrics route)

External connections (all Stub 501 unless implemented later)
POST /api/v1/connections/link-token (Stub 501) Generate token for initiating external account linking flow
POST /api/v1/connections/sync (Stub 501) Trigger data synchronization for linked accounts
POST /api/v1/connections/monthly-data (Stub 501) Retrieve monthly aggregated external account data

Idempotency & Concurrency Summary

- Idempotency-Key REQUIRED for: POST /api/v1/settlements/allocate
- Allocation: HTTP 200 on first and replay
- Mismatched payload reuse of same key: 409 Conflict
- Keys persisted with normalized payload hash (sorted JSON, trimmed strings, fixed precision amount)
- Uniqueness scope: (userId, idempotencyKey, endpoint)
- First request with a key creates settlement (HTTP 200) and persists key + hashed payload
- Exact replay with same payload returns existing settlement (HTTP 200)
- Differing payload reuse of the key causes conflict (HTTP 409)
- Concurrency gap: parallel allocations between same payer/payee[/group] may race (future locking)
- Future: extend idempotency to additional mutation endpoints as retry patterns emerge
