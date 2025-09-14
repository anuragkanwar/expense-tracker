# Low Level Design (LLD) - Pocket Pixie (Core Domain Focus)

Updated: 2025-09-14 (F5 Stages 1–3 complete; F6 resolved: allocation emits ledger transaction)

## Overview

Pocket Pixie is a comprehensive financial management application supporting individual and group expense tracking with advanced settlement capabilities. The system uses double-entry accounting to ensure financial integrity and provides real-time balance calculations. A new canonical settlement allocation flow (FIFO across upfront recognized expense shares) has been introduced to replace legacy direct debt reversal settlements.

## Core Architecture Principles

### Double-Entry Accounting System

- **Every transaction affects two accounts** with equal but opposite amounts (applies to allocation settlements as of Flag F6 resolution)
- **Maintains financial integrity** through balanced entries
- **Supports complex operations** like settlements, loans, and group expenses

### Data Sources

- **Transaction Entries**: Primary source for historical ledger (double-entry)
- **User Balance Table**: Materialized view of net debt between users (performance optimization)
- **Expense/Split Tables**: Metadata for group expense relationships (legacy model)
- **Expense Share Table (NEW)**: Upfront recognition of per-user obligation per expense
- **Settlement Application Table (NEW)**: Allocation fragments linking settlements to specific expense shares

## Transaction System Architecture (Conceptual Only)

### Core Concepts

- **Account Types**: INCOME, EXPENSE, OUTGOING, LOAN_GIVEN, LOAN_TAKEN, EXTERNAL, SAVING
- **Sign Convention**: Positive amounts = money coming in, Negative amounts = money going out
- **Aggregation Strategy**: Sum only positive amounts per account type (except loan accounts which use net aggregation)

### Account Structure

- **Single Accounts** (one per user):
  - 1 INCOME account (salary, dividends, etc.)
  - 1 OUTGOING account (user's cash/wallet)
  - 1 EXTERNAL account (external sources/sinks)
  - 1 LOAN_GIVEN account (money lent to others)
  - 1 LOAN_TAKEN account (money borrowed from others)
  - 1 SAVING account (user's savings)

- **Multiple Accounts** (user can create many):
  - Multiple EXPENSE accounts (Rent, Groceries, Entertainment, etc.)

### Key Transaction Flows (Conceptual)

1. **Expense Recording**: `OUTGOING (-) → EXPENSE (+)`
2. **Income Recording**: `EXTERNAL (-) → INCOME (+)`
3. **Saving**: `OUTGOING (-) → SAVING (+)`
4. **Loan Creation**: `LOAN_GIVEN (-) → LOAN_TAKEN (+)`
5. **Settlement (Legacy Direct)**: Debt reversal + optional expense cash flow entries
6. **Settlement (New Allocation)**: User balance + expense share status adjustments + ledger reversal (F6)

#### Detailed Domain Flows (Operational Design Decisions)

These flows formalize the end-to-end behaviors and are treated as explicit design decisions. Each flow lists: Purpose, Trigger (primary entrypoint), Tables Written (W) / Read (R), Ledger Entries, User Balance Effect, Share / Settlement Artifacts, Core Invariants, Notes (including flagged risks where applicable).

Flow 1: Personal Expense (Non-Shared)

- Purpose: Record a user's own expense with no interpersonal obligation.
- Trigger: Transaction creation (type EXPENSE) with only payer context.
- Services: TransactionService.
- Tables (W): transaction, transaction_entry, (optionally expense metadata). No expense_share rows.
- Ledger: OUTGOING (-) → EXPENSE (+) (double-entry).
- User Balance: None (no rows updated in user_balance).
- Expense Shares: None created.
- Invariants: Sum(entry amounts) = 0 (double-entry); no splits referencing other users.
- Notes: Purely impacts personal analytics and category reporting.

Flow 2: Income / Saving

- Purpose: Capture inflows (INCOME) or transfers to savings (SAVING) for analytical aggregation.
- Trigger: Transaction creation (types INCOME / SAVING sequences as per conceptual mapping).
- Services: TransactionService.
- Tables (W): transaction, transaction_entry.
- Ledger: EXTERNAL (-) → INCOME (+) OR OUTGOING (-) → SAVING (+).
- User Balance: None.
- Expense Shares: None.
- Invariants: No cross-user state touched.
- Notes: Provides basis for dashboards (income, savings rates).

Flow 3: Direct Loan (Loan Given) [Canonical via LoanService]

- Purpose: Represent bilateral lending between two users.
- Trigger: Loan transaction creation (type MUST be LOAN_GIVEN) via /api/v1/loans. LOAN_TAKEN direction is hard blocked (Stage 3 interim decision of Flag F5) – clients must always submit LOAN_GIVEN.
- Services: LoanService (canonical). TransactionService path BLOCKED (Flag F5 remediation stage 1).
- Tables (W): transaction, transaction_entry, user_balance (two mirrored rows), loan + loan_payer + loan_splits metadata. (Future: may emit expense_share rows after obligation model unification.)
- Ledger: LOAN_GIVEN (-) → LOAN_TAKEN (+).
- User Balance: +amount row for lender perspective, -amount reciprocal for borrower (via BalanceAdjustmentService.applyBilateralDelta or InterpersonalDebtEngine.recordDirectLoan when available).
- Expense Shares: Not created today (loan relies on ledger + balance) – potential future normalization.
- Invariants: Exactly one split; split amount == transaction amount; payer and split user distinct; creation only allowed through /api/v1/loans endpoint; type must be LOAN_GIVEN.
- Notes: Canonical interpersonal debt origin; dual-path divergence removed by hard block in TransactionService. Stage 3 interim consolidation removes legacy asymmetric LOAN_TAKEN validation in favor of a single canonical direction. Standardized error schemas (StandardErrorSchema) applied (400 validation, 404 not found).

Flow 4: Direct Friend Settlement (Legacy Debt Reversal)

- Purpose: Settle (partially or fully) an outstanding bilateral loan without referencing specific historical expense shares.
- Trigger: BalanceService.createSettlement (legacy endpoint).
- Tables (W): transaction, transaction_entry (reversal), settlement, user_balance updates.
- Ledger: LOAN_TAKEN (-) → LOAN_GIVEN (+) (reversing prior direction) plus optional expense/outgoing pair in group legacy variant.
- User Balance: Decrease debt magnitude (moves toward zero for both mirrored rows).
- Expense Shares: Not consulted (risk of divergence with share-based canonical model).
- Invariants: Settlement amount > 0; parties distinct.
- Notes: Does NOT cap against net outstanding (Flag F2). Maintained for backward compatibility.

Flow 5: Shared Expense (Group or Friends)

- Purpose: Record multi-party expense where one user fronts payment for others.
- Trigger: Expense creation with participant splits (type EXPENSE with splits count > 0 and multi-user).
- Services: ExpenseService + TransactionService (loan-style entries) + (NEW) ExpenseShare creation logic.
- Tables (W): transaction, transaction_entry (OUTGOING/EXPENSE + loan pair entries per participant), expense_share (one per participant + optional payer share), user_balance rows updated.
- Ledger: Combination of personal expense entry (if payer share) plus per-participant loan entries (LOAN_GIVEN/LOAN_TAKEN directionality).
- User Balance: Payer gains positive balances vs each participant; participants get reciprocal negatives (and group-scoped rows if groupId present).
- Expense Shares: Created upfront – authoritative obligation representation.
- Invariants: Σ(participant shares including payer share) == total expense; payer share row excluded from future allocations (isPayerShare=1).
- Notes: Balance sign inconsistency risk in update path (Flag F1).

Flow 6: Settlement Allocation (Canonical FIFO)

- Purpose: Allocate a participant's repayment across multiple historical outstanding shares to a payer (optionally within a group) deterministically (FIFO by realizedAt, id).
- Trigger: SettlementService.allocateExpenseShareSettlement.
- Tables (R/W): expense_share (R/W), settlement (W), settlement_application (W), user_balance (W), transaction (W), transaction_entry (W).
- Ledger: LOAN_TAKEN (-) → LOAN_GIVEN (+) single reversing pair (payer LOAN_TAKEN src, payee LOAN_GIVEN dst) for the requested amount (one transaction per allocation request, idempotent replay emits none).
- User Balance: Net interpersonal amount reduced by totalApplied; mirrored rows adjusted.
- Expense Shares: paidAmount + status transitions (UNPAID → PARTIALLY_PAID → PAID).
- Invariants: amount <= outstandingBefore + ε; currency homogeneous; atomic allocation.
- Notes: Canonical path for repayments; idempotency & ledger parity achieved (F3 & F6 resolved).

Flow 7: Aggregation & Derived Views Layering

- Purpose: Clarify separation of concerns across financial data strata.
- Layers:
  1. Ledger (transaction / transaction_entry): Chronological double-entry facts.
  2. Obligation Layer (expense_share + settlement_application): Deterministic obligations & allocation audit.
  3. Net Balance (user_balance): Materialized interpersonal net positions for fast retrieval.
  4. Reporting (dashboard summaries, category analytics): Consumes ledger + net balance; eventually to read shares directly for obligation-focused UI.
- Design Decision: user_balance is authoritative for current net interpersonal debt; expense_share is authoritative for remaining per-expense obligations; ledger retains full historical truth and (as of F6 resolution) includes allocation settlement repayments.
- Reconciliation Need: Periodic job (Flag F7) to assert user_balance == derived(sum(unpaid shares) - allocations) under chosen sign convention.

### Category Derivation (Conceptual)

**Recent Enhancement**: Settlement categories are derived from transaction account names rather than expense descriptions:

1. **Query Flow**: `expense.transactionId → transactionEntry (positive amount) → transactionAccount.name`
2. **Fallback**: Uses "GENERAL" if no specific category found
3. **Benefits**: Consistent categorization across all transaction types

### Loan Transaction Validation (Conceptual Rules & Enforcement Status)

**Canonical Direction Only (LOAN_GIVEN)** – LOAN_TAKEN creation requests are rejected (400) as of Flag F5 Stage 3 interim decision.

1. **Split Requirements**:
   - Must have exactly one split entry in the `splits` array
   - The split amount must exactly match the transaction amount (implies payerTotal == 0)
2. **Account Validation**:
   - **Source Account**: Must be the payer's `LOAN_GIVEN` account
   - **Destination Account**: Must be the split user's `LOAN_TAKEN` account
3. **Transaction Type Constraint**:
   - Request `type` must be `LOAN_GIVEN`; any `LOAN_TAKEN` attempt returns `"LOAN_TAKEN creation is disabled – use LOAN_GIVEN canonical direction"`
4. **Business Logic**:
   - Loans can only be created between two distinct users (payer and one split user)
   - Prevents invalid account combinations and ensures proper loan relationship tracking

(Future Consideration: InterpersonalDebtEngine may introduce symmetrical abstractions eliminating the need for a direction field in client payloads.)

### InterpersonalDebtEngine Invariants (Initial Implementation)

Current Scope (Stage 0 Skeleton):

- Provides two methods: recordDirectLoan and recordRepayment.
- Delegates bilateral balance mutations to BalanceAdjustmentService.applyBilateralDelta.
- Does not yet emit ledger entries or persist loan metadata (handled by LoanService / transaction systems).

Invariants Enforced:

1. creditorId != debtorId (both methods) -> prevents self-loans/repayments.
2. amount > 0 (input domain constraint) -> rejects zero / negative raw amounts; repayment semantics invert sign internally.
3. Positive loan amount increases bilateral obligation (creditor perspective +amount, debtor perspective -amount).
4. Repayment amount reduces obligation symmetrically (applies -amount delta via BalanceAdjustmentService).
5. groupId propagation: Provided groupId (number) scopes the bilateral rows; null enforces overall (non-group) rows; undefined leaves repository findBalance queries using undefined to differentiate creation semantics.
6. Currency is passed through verbatim; no FX normalization (Flag F10 still applicable—multi-currency logic deferred).

Non-Goals / Deferred:

- Idempotency layer at engine boundary (handled at higher service layer today).
- Ledger emission policy (future optimization for summarization only; correctness covered by F6 resolution).
- Validation of existing outstanding before repayment (delegated to higher-level services that understand obligation context or share allocations).
- Multi-currency conversion or normalization.

Regression Targets (Covered by New Tests):

- Direct loan path calls applyBilateralDelta with +amount.
- Repayment path calls applyBilateralDelta with -amount.
- Self-loan and self-repayment rejected early.
- Non-positive amounts rejected early.
- Group-scoped vs overall propagation verified.

### Recurring Item Flows (Conceptual)

1. **Income (CREDIT)**: `EXTERNAL (-) → INCOME (+)`
2. **Expense (DEBIT)**: `OUTGOING (-) → EXPENSE (+)`
3. **Saving (DEBIT)**: `OUTGOING (-) → SAVING (+)`

### Aggregation Logic (Conceptual)

- **Income**: `SUM(amount > 0)` from INCOME accounts (inflows only)
- **Expenses**: `SUM(amount > 0)` from EXPENSE accounts (inflows only)
- **Savings**: `SUM(amount > 0)` from SAVING accounts (inflows only)
- **Assets**: `SUM(all amounts)` from LOAN_GIVEN accounts (net position)
- **Liabilities**: `SUM(all amounts)` from LOAN_TAKEN accounts (net position)
- **Net Worth**: Assets - Liabilities

**Note**: Loan accounts (LOAN_GIVEN, LOAN_TAKEN) use net aggregation because settlements create both positive and negative entries that must be summed together to get the correct outstanding balance.

## User Balance System

**Materialized view** of net debt between users for performance:

- **Structure**: `(ownerId, counterPartyId, groupId, amount, currency)`
- **Purpose**: Fast lookups without complex transaction queries

### Balance Types

1. **Overall Balance** `(owner, counterParty, NULL, amount)`:
   - Net debt across all contexts (direct + groups)
   - `+amount`: counterParty owes owner
   - `-amount`: owner owes counterParty
2. **Group Balance** `(owner, counterParty, groupId, amount)`:
   - Debt within specific group context
   - Separate tracking per group membership

### Key Properties

- **Owner's perspective**: Always from owner's viewpoint
- **Real-time updates**: Modified on loan creation, settlement, and (new) allocation
- **Performance critical**: Enables fast UI balance displays

## Group Expense & Settlement System

### Legacy Expense Creation Flow (Pre-Expense Share Table)

#### For Regular Expenses (TXN_TYPE.EXPENSE):

1. **Payer Expense**: `OUTGOING (-) → EXPENSE (+)` for payer's share (when payerTotal > 0)
2. **No Payer Expense**: When payerTotal = 0 (payer's share fully covered by splits)
3. **Error Condition**: When payerTotal < 0 (splits exceed total amount)
4. **Loan Generation**: `LOAN_GIVEN (-) → LOAN_TAKEN (+)` for each participant
5. **Balance Updates**: Update user_balance table to reflect loan relationships
6. **Metadata Storage**: Expense and split records in relational tables

#### For Loan Transactions (TXN_TYPE.LOAN_GIVEN/LOAN_TAKEN):

1. **No Payer Expense**: Loans don't create expense transactions
2. **Direct Loan Transfer**: `LOAN_GIVEN (-) → LOAN_TAKEN (+)` for the full amount
3. **Validation**: Split amount must equal total amount (ensures payerTotal = 0)
4. **Balance Updates**: Update user_balance table to reflect loan relationships
5. **Metadata Storage**: Expense and split records in relational tables (for tracking)

### Legacy Settlement Flow (Direct Debt Settlement)

#### Direct Debt Settlement

1. **Debt Reversal**: `LOAN_TAKEN (-) → LOAN_GIVEN (+)` to negate original loan
2. **Settlement Record**: Stored for audit trail

#### Group Debt Settlement

1. **Debt Reversal**: `LOAN_TAKEN (-) → LOAN_GIVEN (+)` to negate original loan
2. **Expense Cash Flow**: `OUTGOING (-) → EXPENSE (+)` to record the underlying shared expense payment
3. **Settlement Record**: Stored for audit trail

### Detailed Direct Settlement Database Operations (Legacy)

1. **Transaction Header**: Created with settlement description
2. **Transaction Entries**: 2 entries (double-entry) - payer's `LOAN_TAKEN (-)` and payee's `LOAN_GIVEN (+)`
3. **Account Balance Updates**: Corresponding updates to account balances
4. **User Balance Table Updates**: Two rows mirrored (owner/counterparty perspectives)
5. **Settlement Table**: Audit record

### Balance Update Flow (Applies to Legacy + New)

For each participant in a shared expense:

1. **Payee Balance**: `payee (owner) owes payer (counterparty) -amount` OR (if payer advanced funds) owner=original payer has positive amount relative to participant
2. **Payer Balance**: `payer (owner) is owed by payee (counterparty) +amount`
3. **Group Context**: If expense is group-based, balances are tracked per group
4. **Overall Balance**: Non-group balances also maintained for cross-context settlements

### Upfront Expense Recognition & Expense Shares (Canonical Model)

The system now normalizes shared expense obligations at creation time into the `expense_share` table. This replaces implicit reliance on original loan splits for tracking outstanding amounts.

#### Goals

- Explicit, query-efficient representation of each participant's obligation
- Support partial settlements across multiple historical expenses (FIFO)
- Provide per-share lifecycle status (UNPAID → PARTIALLY_PAID → PAID)
- Decouple settlement application logic from raw transaction splits

#### Expense Share Data Model

Table: `expense_share`
Fields:

- `id` PK
- `transactionId` (FK -> transaction) original expense transaction header
- `payerUserId` user who fronted the expense
- `participantUserId` user owing this share (can be same as payer when `isPayerShare=1`)
- `groupId` nullable group context
- `shareType` (FRIENDS | GROUP | NONE)
- `splitType` (EQUAL | PERCENTAGE | SHARE)
- `expenseAccountId` optional expense account reference (for category lineage)
- `currency` 3-letter code (no FX conversion yet)
- `amount` total obligation for this share
- `paidAmount` cumulative settled amount applied (<= amount)
- `status` UNPAID | PARTIALLY_PAID | PAID
- `realizedAt` timestamp when share was recognized
- `isPayerShare` (0/1) flag identifying payer’s own share (excluded from allocations when 1)
- `metadata` arbitrary JSON (future: original percentage, notes, etc.)

#### Invariants

- `0 <= paidAmount <= amount`
- `status` transitions: UNPAID → PARTIALLY_PAID → PAID (monotonic; no reversal without corrective admin workflow)
- Payer share rows (`isPayerShare=1`) must not be allocated against settlements
- Currency homogeneity per allocation request

### Settlement Allocation Flow (Canonical)

Endpoint: `POST /api/v1/settlements/allocate`

Purpose: Allocate a payment made by a participant (debtor) to an original payer across that debtor’s outstanding shares owed to the payer using FIFO ordering (earliest recognized first: `createdAt ASC, id ASC`).

#### Inputs

- `payeeId` (original payer receiving funds)
- Implicit `payerId` from authenticated user (participant paying back)
- `amount` positive numeric
- `currency` 3-letter ISO code (must match target outstanding shares)
- Optional `groupId` (null or number — if provided, only those shares considered)

#### Validation

1. `payerId != payeeId`
2. `amount > 0`
3. At least one allocatable share exists (participantUserId = payerId, payerUserId = payeeId, status in {UNPAID, PARTIALLY_PAID}, `isPayerShare=0`, currency + group criteria match)
4. `amount <= totalOutstanding + ε` (ε = 1e-8 tolerance for floating precision)

#### Allocation Logic (FIFO Concept)

```
shares = fetchAllocatableShares(payerId, payeeId, currency, groupId) // ordered
outstandingBefore = Σ (share.amount - share.paidAmount)
assert amount <= outstandingBefore
create settlement record (payerId pays payeeId) + ledger loan reversal (payer LOAN_TAKEN -> payee LOAN_GIVEN)
remaining = amount
for share in shares (while remaining > 0):
  shareRemaining = share.amount - share.paidAmount
  apply = min(shareRemaining, remaining)
  newPaid = share.paidAmount + apply
  newStatus = (≈share.amount) ? PAID : PARTIALLY_PAID
  update share(paidAmount=newPaid, status=newStatus)
  insert settlement_application(settlementId, expenseShareId, appliedAmount=apply)
  remaining -= apply
update user_balance (payeeOwnerRow.amount -= totalApplied)
update user_balance (payerOwnerRow.amount += totalApplied)
compute outstandingAfter = outstandingBefore - totalApplied
return settlement + applications + totals
```

#### Settlement Application (Conceptual Data Model)

Table: `settlement_application`

- `id` PK
- `settlementId` FK → settlement
- `expenseShareId` FK → expense_share
- `appliedAmount` amount applied to that share
- `createdAt` timestamp

#### User Balance Adjustment Semantics (Conceptual)

- Row with `ownerId=payeeId` & `counterPartyId=payerId` decreases by `totalApplied` (payer owes less → payer's debt reduced)
- Reciprocal row with `ownerId=payerId` increases by `totalApplied` (payer’s perspective improves / becomes less negative)
- If balances hit 0, rows are retained (no auto-delete) for audit continuity (future optimization: prune zero rows)

#### Precision Handling (Conceptual Guidance)

- Floating comparison tolerance: 1e-8 to classify a share as fully paid
- Avoid cumulative drift by applying min(shareRemaining, remaining) and deriving outstandingAfter from before - applied

#### Error Scenarios (Allocation - Conceptual)

| Condition             | Error | Message Example                             |
| --------------------- | ----- | ------------------------------------------- |
| Self settlement       | 400   | "Cannot settle with self"                   |
| Non-positive amount   | 400   | "Settlement amount must be positive"        |
| No outstanding shares | 400   | "No outstanding shares to settle"           |
| Over-allocation       | 400   | `Settlement amount X exceeds outstanding Y` |

#### Concurrency & Idempotency (Conceptual)

- Entire allocation executes inside a single database transaction.
- Idempotency: Allocation endpoint requires Idempotency-Key; identical payload + key returns prior context without new ledger transaction.
- Race Condition (open): Parallel allocations between same payer/payee pair could both read pre-allocation outstanding. Mitigation (future - Flag F8): row locking or application-level mutex.

#### Ledger Consistency (Allocation Parity Achieved)

- Principle: every monetary movement is represented as double-entry ledger entries.
- Current State: `allocateExpenseShareSettlement` emits a single reversing loan transaction (`LOAN_TAKEN (-) → LOAN_GIVEN (+)`) plus obligation + balance updates.
- Implication: Loan account aggregations and ledger-based analytics reflect repayments immediately; reconciliation (F7) focuses on validating obligation-layer consistency rather than compensating for missing ledger entries.
- Future Enhancement: Optional summarization/aggregation layer may still be introduced for performance/compaction (not correctness).

### Legacy vs Canonical Flow (Conceptual Comparison)

| Aspect                | Legacy Direct Settlement         | New Allocation Flow                   |
| --------------------- | -------------------------------- | ------------------------------------- |
| Granularity           | Single debt at a time            | Spans multiple historical shares FIFO |
| Ledger Entries        | Yes (double-entry)               | Yes (double-entry reversal)           |
| Partial Allocation    | Indirect (by smaller settlement) | Native per-share partials             |
| Share Status Tracking | Implicit via loans               | Explicit (UNPAID/PARTIALLY_PAID/PAID) |
| Flexibility           | Limited                          | High (multi-expense allocation)       |
| Recommended Use       | Backward compatibility only      | Primary path                          |

### Key Features

- **Multi-party splits**: Complex group expense distribution
- **Flexible settlements**: Partial and full debt resolution (improved with FIFO allocation)
- **Upfront Expense Recognition (NEW)**: Explicit per-user obligations
- **FIFO Settlement Allocation (NEW)**: Deterministic allocation order with ledger parity
- **Direct loan support**: Non-group loan scenarios
- **Expense Share Status Lifecycle (NEW)**: UNPAID → PARTIALLY_PAID → PAID
- **Consistent Balance Tracking**: User balances updated across all flows

## Implementation Architecture (Brief Domain Mapping Only)

### Service Layer

- **ExpenseService**: Manages expense creation with automatic loan/share generation (future: create expense_share records directly if not already)
- **SettlementService**: Processes debt settlements & share allocation
- **BalanceService**: Handles direct loans/settlements with transaction entries
- **TransactionHelperService**: Manages double-entry transaction creation and account updates
- **DashboardService**: Provides aggregated financial analytics
- **AuthService**: Handles user authentication and account initialization
- **GroupService**: Manages group operations and member relationships
- **FriendService**: Manages user friendships and social connections

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: Loose coupling
- **Transaction Management**: Atomic financial operations

### Transaction Management & Error Handling (Conceptual)

#### Database Transaction Strategy

**Critical Operations Requiring Transactions:**

- `ExpenseService.createExpense()`
- `BalanceService.createSettlement()` (legacy)
- `BalanceService.recordLoan()`
- `AuthService.signUp()`
- `SettlementService.allocateExpenseShareSettlement()` (NEW)

**Transaction Pattern:**

```typescript
await this.db.transaction(async (tx) => {
  // Multiple operations using tx (atomic)
});
```

**Repository Method Signature:**

```typescript
async methodName(params, tx?: DBTransactionType): Promise<Result>
```

#### Error Handling Strategy

- **Validation Errors**: Input validation failures (400 Bad Request)
- **Not Found Errors**: Missing resources (404 Not Found)
- **Transaction Errors**: Database constraint violations (500 Internal Server Error)
- **Authentication Errors**: Unauthorized access attempts
- **Atomic Rollbacks**: All-or-nothing transaction behavior

### Critical Integration Evolution

**Previous Guarantee**: All financial activities produced both ledger entries and user_balance updates.

**Current Nuance**:

- Direct loans: Create `LOAN_GIVEN (-) → LOAN_TAKEN (+)` entries + user_balance
- Direct settlements (legacy): Ledger reversal entries + user_balance
- Group settlements (legacy): Debt reversal + expense cash flow + user_balance
- Shared expenses: Loan (or share) creation with ledger entries + user_balance
- Allocation settlements (NEW): Share + user_balance updates + single loan reversal ledger transaction

## API Surface (Conceptual Addendum)

### New Endpoints

`POST /api/v1/settlements/allocate`

`POST /api/v1/loans` (NEW - canonical direct loan creation; returns created loan row)
`GET /api/v1/loans` List user's loans (payer or participant – participant filtering TBD; current implementation returns payer-created loans)
`GET /api/v1/loans/{loanId}` Get loan details (authorization: creator only until participant join implemented)
`PUT /api/v1/loans/{loanId}` Update loan (description, loanDate) (creator only)
`DELETE /api/v1/loans/{loanId}` Delete loan (creator only)

Deprecated: Creating LOAN_GIVEN / LOAN_TAKEN via `/api/v1/transactions` (blocked at service layer).
Request Body:

```
{
  "payeeId": number,
  "amount": number,
  "currency": "USD",
  "groupId?": number
}
```

Response:

```
{
  settlement: {...},
  applications: [{ expenseShareId, appliedAmount, ... }],
  totalApplied: number,
  outstandingBefore: number,
  outstandingAfter: number
}
```

### Backward Compatibility

- Existing settlement endpoints remain; clients should migrate to allocation for multi-expense paydowns.
- Mobile client pending integration for allocation.

## Current Domain Status (Summary)

### ✅ Established Domain Capabilities

- Double-entry accounting system (core ledger)
- Group expense creation with automatic loan relationship generation
- Settlement flow (legacy) with debt reversal and payment recording
- Upfront expense share recognition (NEW)
- FIFO settlement allocation across expense shares (NEW) with ledger parity
- Direct loan/settlement integration with transaction system
- Transaction account-based category derivation system
- User balance table for optimized balance calculations
- Comprehensive transaction validation and error handling
- Repository pattern implementation with transaction support

### ⚠️ Known Domain Gaps / Transitional Debt

#### Flag Register (Active Design Risks)

(Each flag references the flow(s) it impacts and planned remediation track.)

- Flag F2 (Overpayment Not Prevented in Direct Settlement): RESOLVED. Direct legacy settlements (Flow 4) now validate requested amount against current outstanding (creditor perspective user_balance row). Attempts where outstanding <= 0 or amount > outstanding are rejected with `Settlement amount X exceeds outstanding Y`. Prevents negative debt states.
- Flag F3 (Missing Idempotency Documentation / Enforcement for Allocation & Direct Settlement Replay Semantics): RESOLVED. Allocation endpoint and direct settlement endpoints now require Idempotency-Key header; settlement table enforces unique key; direct settlement returns 201 on first creation and 200 on exact replay (same payload). Both direct and allocation flows return 409 (IDMP_KEY_CONFLICT) when the same key is reused with differing payload (payerId, payeeId, amount, currency, groupId). Standardized error schemas (StandardErrorSchema, IdempotencyConflictErrorSchema) applied across balances, group settlement, and allocation routes.
- Flag F4 (Zero-Amount Payer Share Rows Noise): Flow 5 may create payer share entries with amount 0 but status UNPAID. Planned: Either omit zero rows or mark as PAID at insertion; migration to clean existing noise.
- Flag F5 (Dual Loan Pathways Divergence): RESOLVED (Stages 1–3). Stage 1: TransactionService blocks LOAN_GIVEN / LOAN_TAKEN. Stage 2: Dedicated /loans API with standardized error schemas (400/404). Stage 3: Removed asymmetric validation; LOAN_TAKEN creation hard blocked (single canonical LOAN_GIVEN direction). Future: InterpersonalDebtEngine may abstract away explicit direction in client payloads.
- Flag F6 (Ledger Omission for Allocations): RESOLVED. Allocation flow now emits a single loan reversal double-entry (`LOAN_TAKEN (-) → LOAN_GIVEN (+)`) per request restoring ledger parity. Remaining follow-up deferred to F7 (reconciliation) and optional future summarization (performance, not correctness).
- Flag F7 (Lack of Reconciliation Utility): No job asserting user_balance matches derived obligations from expense_share/settlement_application (Flows 5 & 6). Planned: Background script + admin endpoint surfacing discrepancies.
- Flag F8 (Concurrency Race on Parallel Allocations): Parallel Flow 6 requests can over-allocate same shares. Planned: DB-level row locking (when supported) or application mutex keyed by payerId-payeeId-groupId triad.
- Flag F9 (Incomplete OpenAPI / Contract Coverage): Allocation endpoint further docs & share listing endpoints absent (affects discoverability for Flows 5 & 6). Planned: Extend contracts + SDK generation.
- Flag F10 (No FX / Multi-Currency Normalization): Cross-currency settlements undefined (affects potential future Flows 5 & 6). Planned: Currency normalization layer + stored functional currency per group/user.

#### Resolved Flags (Historical)

- Flag F1 (Balance Sign Inconsistency): RESOLVED. A canonical bilateral mutation path was introduced via BalanceAdjustmentService.applyBilateralDelta(creditorId, debtorId, amount). All shared expense and settlement flows now conform: positive amount increases debtor obligation; negative amount reduces it. Legacy inconsistent mutation paths removed/refactored. Existing user_balance rows created under old convention were aligned during refactor (future data migration note if historical data existed pre-refactor).

- Concurrency control (locking) for simultaneous allocations not implemented (F8)
- Share listing & filtering API endpoints (participant vs payer, status) not exposed yet (F9)
- Zero-balance pruning not implemented

### 🔄 Planned Domain Evolutions

- Advanced transaction aggregation optimization
- Multi-table relationship performance tuning
- Optional ledger summarization for allocation settlements (performance only)
- Share query endpoints & dashboard adjustments to use expense_share directly
- Multi-currency support & FX normalization
- Enhanced API documentation and OpenAPI compliance

### 🎯 Future Domain Enhancements (High-Level)

- Multi-currency transaction support
- Advanced transaction indexing strategies
- Distributed transaction management
- Real-time balance synchronization
- Ledger reconciliation service for allocation entries (verification focus)
- Enhanced API documentation & discoverability

---

_This LLD serves as the architectural foundation for Pocket Pixie. For implementation details, refer to the codebase, service layer logic, and repository contracts. The document reflects the state after introduction of the expense share & FIFO settlement allocation flow with ledger parity (2025-09-14)._
