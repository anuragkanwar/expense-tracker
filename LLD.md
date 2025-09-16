# Low Level Design (LLD) - Pocket Pixie

Updated: 2025-09-16

---

## 1. Overview

Pocket Pixie is a financial collaboration platform for individual and group expense tracking, bilateral loans, and structured repayments. The platform is grounded in double-entry accounting and an explicit obligation layer (expense shares + settlement allocations) with a materialized bilateral balance table for fast lookups.

Core pillars:

- Double-entry ledger for immutable monetary facts
- Obligation layer for per-expense outstanding amounts and audited allocations
- Materialized bilateral/net balances for performant UI & analytics
- Strong service-layer validation + explicit, propagated database transactions

---

## 2. Architectural Layers

1. Ledger Layer: transaction + transaction_entry (chronological, immutable double-entry facts)
2. Obligation Layer: expense_share + settlement_application (recognized obligations + allocation audit trail)
3. Net Balance Layer: user_balance (materialized bilateral positions, overall + group scoped)
4. Reporting Layer: Aggregations (dashboards, summaries) derived from the above

Principle: user_balance must remain derivable from (recognized obligations - applied allocations) under a consistent sign convention.

---

## 3. Accounting & Data Sources

- Every transaction posts two entries whose signed amounts sum to zero (current design gap: allocation flow does not yet emit entries)
- Sign convention (conceptual): Positive entry values = inflow to that account; negative = outflow (directional interpretive semantics depend on account type)
- Data sources:
  - Ledger: transaction_entry
  - Obligation: expense_share + settlement_application
  - Materialized Net: user_balance
  - Metadata Legacy: legacy expense/split records (superseded by expense_share)

---

## 4. Account Model

Account Types (per user unless noted): INCOME, EXPENSE (many), OUTGOING, EXTERNAL, LOAN_GIVEN, LOAN_TAKEN, SAVING.

Typical flows:

1. Personal Expense: OUTGOING (-) → EXPENSE (+)
2. Income: EXTERNAL (-) → INCOME (+)
3. Saving: OUTGOING (-) → SAVING (+)
4. Direct Loan: LOAN_GIVEN (-) → LOAN_TAKEN (+)
5. Allocation (canonical repayment): obligation + user_balance updates (ledger entries pending)

Aggregation guidance:

- For analytic totals (income/expense/saving categories) sum positive amounts in destination accounts
- Loan accounts (LOAN_GIVEN / LOAN_TAKEN) require net aggregation (sum all signed amounts) because reversals introduce mixed signs

---

## 5. Domain Flows

Each flow lists: Purpose, Trigger/Service, Tables Written (W) / Read (R), Ledger Entries, Balance Effects, Invariants, Notes.

### 5.1 Personal Expense (Non-Shared)

- **Purpose**: Record a personal expense with no sharing
- **Trigger**: `TransactionService.createTransaction` (type EXPENSE, no splits)
- **Data Flow**:
  1. User submits expense details (amount, description, category, date)
  2. TransactionService validates input (positive amount, valid category)
  3. TransactionService creates transaction record (header)
  4. TransactionHelperService creates two transaction_entry records (double-entry)
  5. No interpersonal balances affected
- **Tables & Records**:
  - `transaction`: Single row with {id, description, userId (creator), date, type: EXPENSE}
  - `transaction_entry`: Two rows:
    - Row 1: {transactionId, transactionAccountId (OUTGOING account), amount: -amount}
    - Row 2: {transactionId, transactionAccountId (EXPENSE category account), amount: +amount}
- **Ledger**: OUTGOING (-) → EXPENSE (+)
- **user_balance**: none (no interpersonal debt)
- **Invariants**: Sum(entries)=0; single-user context; amount > 0

### 5.2 Income / Saving

- **Purpose**: Record income receipt or savings transfer
- **Trigger**: `TransactionService.createTransaction` (type INCOME or SAVING)
- **Data Flow**:
  1. User submits transaction details (amount, description, category, date)
  2. TransactionService validates input (positive amount, valid type)
  3. TransactionService creates transaction record (header)
  4. TransactionHelperService creates two transaction_entry records (double-entry)
  5. No interpersonal balances affected
- **Tables & Records**:
  - `transaction`: Single row with {id, description, userId (creator), date, type: INCOME or SAVING}
  - `transaction_entry`: Two rows:
    - For Income:
      - Row 1: {transactionId, transactionAccountId (EXTERNAL), amount: -amount}
      - Row 2: {transactionId, transactionAccountId (INCOME category), amount: +amount}
    - For Saving:
      - Row 1: {transactionId, transactionAccountId (OUTGOING), amount: -amount}
      - Row 2: {transactionId, transactionAccountId (SAVING category), amount: +amount}
- **Ledger**: EXTERNAL (-) → INCOME (+) or OUTGOING (-) → SAVING (+)
- **user_balance**: none (no interpersonal debt)
- **Invariants**: Sum(entries)=0; single-user context; amount > 0; valid account types

### 5.3 Symmetric Loan Creation (/api/v1/loans/symmetric)

- **Purpose**: Create a direct bilateral loan between two users (creditor lends to debtor)
- **Endpoint**: POST /api/v1/loans/symmetric
- **Trigger**: LoanService.createDirectLoanSymmetric
- **Data Flow**:
  1. User (creditor) submits loan details (debtorId, amount, currency, description, optional groupId)
  2. LoanService validates relationship context (friendship or group membership)
  3. LoanService creates transaction header via TransactionService
  4. LoanService calls createLoanRelationship to:
     - Find loan accounts for both users
     - Create ledger entries via TransactionHelperService
     - Update bilateral balances via InterpersonalDebtEngine/BalanceAdjustmentService
  5. LoanService creates loan record
  6. LoanService creates exactly one loan_split record (for the debtor)
  7. Response includes enriched loan details with creditorId and debtorId
- **Tables & Records**:
  - `transaction`: Single row with {id, description, userId: creditorId, type: LOAN_GIVEN}
  - `transaction_entry`: Two rows:
    - Row 1: {transactionId, transactionAccountId (creditor's LOAN_GIVEN), amount: -amount}
    - Row 2: {transactionId, transactionAccountId (debtor's LOAN_TAKEN), amount: +amount}
  - `loan`: Single row with {id, createdBy: creditorId, amount, currency, description, groupId (optional), transactionId, loanDate}
  - `loan_split`: Single row with {id, loanId, userId: debtorId, amountOwed: amount, splitType: EQUAL, metadata}
  - `user_balance`: Two mirrored rows:
    - Row 1: {ownerId: creditorId, counterPartyId: debtorId, amount: +amount, currency, groupId (optional)}
    - Row 2: {ownerId: debtorId, counterPartyId: creditorId, amount: -amount, currency, groupId (optional)}
- **Ledger**: LOAN_GIVEN (-) → LOAN_TAKEN (+)
- **user_balance**: +amount (creditor perspective), -amount (debtor perspective)
- **Payload**: debtorId, amount, currency (3-letter), optional groupId, description, loanDate
- **Implicit**: Auth user = creditor
- **Invariants**:
  1. creditorId != debtorId
  2. amount > 0
  3. currency length = 3 (no FX yet)
  4. Context: (groupId present AND both members) OR existing friendship
  5. Single implicit split == amount
  6. Description normalized: blank → ""
  7. Canonical direction only (creditor LOAN_GIVEN → debtor LOAN_TAKEN)
  8. Created only via /api/v1/loans/symmetric
- **Failure (400)**: self-loan, invalid context, non-positive amount, invalid currency
- **Notes**: While loans and expense shares use the same underlying debt tracking mechanisms, they are intentionally maintained as separate domain concepts to reflect their different user-facing purposes and settlement patterns

### 5.4 Direct Settlement (Legacy Debt Reversal)

- **Purpose**: Record a direct settlement payment between users (not tied to specific expenses)
- **Trigger**: BalanceService.createSettlement (legacy endpoint)
- **Data Flow**:
  1. User (payer/debtor) submits settlement details (payeeId/creditorId, amount, currency, optional groupId)
  2. BalanceService validates basic inputs (distinct users, positive amount)
  3. BalanceService begins a database transaction
  4. BalanceService creates transaction header record
  5. BalanceService finds both users' loan accounts
  6. BalanceService creates double-entry for reversing debt via TransactionHelperService
  7. BalanceService creates settlement record
  8. BalanceService updates bilateral balances via BalanceAdjustmentService
  9. Transaction is committed
- **Tables & Records**:
  - `transaction`: Single row with {id, description: "Settlement payment", userId: payerId, type: "SETTLEMENT"}
  - `transaction_entry`: Two rows:
    - Row 1: {transactionId, transactionAccountId (payer's LOAN_TAKEN), amount: -amount}
    - Row 2: {transactionId, transactionAccountId (payee's LOAN_GIVEN), amount: +amount}
  - `settlement`: Single row with {id, payerId, payeeId, amount, currency, groupId (optional), transactionId, settledAt}
  - `user_balance`: Two mirrored rows updated:
    - Row 1: {ownerId: payeeId, counterPartyId: payerId} amount decreased by settlement amount
    - Row 2: {ownerId: payerId, counterPartyId: payeeId} amount increased by settlement amount
- **Ledger**: LOAN_TAKEN (-) → LOAN_GIVEN (+) (reversal); optional expense cash flow pair in legacy group variant
- **Balance Effect**: Reduces payee's claim on payer; reverses original loan entries
- **Invariants**: amount > 0; parties distinct; idempotency key required
- **Notes**: Does not inherently cap to net outstanding (legacy behavior) – present only for backward compatibility
- **Key Difference**: Unlike allocation settlement, this does not update any expense_share records - it simply updates the user_balance directly

### 5.5 Shared Expense (Multi-Party Upfront Recognition)

- **Purpose**: Create a shared expense where participants owe portions to the payer
- **Trigger**: TransactionService with participant splits (group or friend context)
- **Data Flow**:
  1. User (payer) submits expense details with splits (description, amount, participants, splitType, optional groupId)
  2. TransactionService validates relationship context (friendship or group membership for all participants)
  3. TransactionService begins database transaction
  4. Primary expense transaction created (payer's own share, if any):
     - Creates transaction record
     - Creates double-entry: OUTGOING (-) → EXPENSE (+) for payer's portion
  5. For each participant (excluding payer share):
     - Calls LoanService.createLoanRelationship to:
       - Find loan accounts for both users
       - Create loan-style ledger entries (LOAN_GIVEN → LOAN_TAKEN)
       - Update bilateral balances
     - Creates expense_share record to track obligation
  6. If payer is participating in split:
     - Creates expense_share record with isPayerShare=1 (excluded from allocation)
  7. Transaction is committed
- **Tables & Records**:
  - `transaction`: Single row with {id, description, userId: payerId, type: EXPENSE, amount: totalAmount}
  - `transaction_entry`: Multiple rows:
    - For payer's portion (if participating):
      - Row 1: {transactionId, transactionAccountId (payer's OUTGOING), amount: -payerAmount}
      - Row 2: {transactionId, transactionAccountId (payer's EXPENSE category), amount: +payerAmount}
    - For each participant:
      - Row N: {transactionId, transactionAccountId (payer's LOAN_GIVEN), amount: -participantAmount}
      - Row N+1: {transactionId, transactionAccountId (participant's LOAN_TAKEN), amount: +participantAmount}
  - `expense_share`: Multiple rows:
    - For each participant: {id, transactionId, payerUserId, participantUserId, amount: participantAmount, paidAmount: 0, status: "UNPAID", isPayerShare: 0, currency, groupId (optional), splitType}
    - For payer (if participating): {id, transactionId, payerUserId, participantUserId: payerId, amount: payerAmount, isPayerShare: 1, ...}
  - `user_balance`: Two mirrored rows per participant:
    - Row 1: {ownerId: payerId, counterPartyId: participantId, amount: +participantAmount, currency, groupId (optional)} - increased by participant's share
    - Row 2: {ownerId: participantId, counterPartyId: payerId, amount: -participantAmount, currency, groupId (optional)} - decreased by participant's share
- **Ledger**: OUTGOING (-) → EXPENSE (+) for payer share (if any) plus LOAN_GIVEN (-) → LOAN_TAKEN (+) per owing participant
- **user_balance**: payer gains positive vs each participant (+participantAmount); reciprocal negatives
- **Invariants**: Sum(shares) == expense total; payer share flagged isPayerShare=1 and excluded from allocations; all participants have valid relationship context
- **Flow Details**:
  1. First creates main expense transaction (OUTGOING → EXPENSE)
  2. Then creates loan relationships for each participant using `LoanService.createLoanRelationship`
  3. Creates expense_share records tracking each participant's obligation
  4. Updates user_balance between payer and each participant
  5. Group context scopes expenses to specific group members and balances
- **Key Distinction**: Unlike direct loans, shared expenses generate expense_share records for obligation tracking and FIFO allocation

#### 5.5.1 Shared Expenses and Loans: Unified Model

Shared expenses and direct loans both utilize the same underlying loan relationship mechanism:

- Both shared expenses and direct loans create the same ledger entries: LOAN_GIVEN (-) → LOAN_TAKEN (+)
- Both use the same balance update mechanism through `InterpersonalDebtEngine` or `BalanceAdjustmentService`
- Both follow the same sign convention: positive amount increases creditor's balance and decreases debtor's
- Key differences:
  1. Shared expenses generate `expense_share` records for tracking obligations and enabling FIFO allocation
  2. Direct loans track obligations via `loan` and `loan_split` tables
  3. Shared expenses have a parent expense transaction showing OUTGOING → EXPENSE for the payer's share
  4. Shared expenses track partial payments with status transitions (UNPAID → PARTIALLY_PAID → PAID)
  5. Direct loans are typically settled through direct transactions rather than granular allocations
  6. Shared expenses relate to specific purchases while loans represent direct money transfers
  7. The UI presentation needs differ: expenses show what was purchased, loans show simple money transfers

This approach provides consistent underlying debt tracking while preserving the semantic differences that are important to users. Both mechanisms maintain bilateral balances through the same services and create appropriate ledger entries, ensuring consistency in the core financial model.

### 5.6 Settlement Allocation (Canonical FIFO Repayment)

- **Purpose**: Allocate a settlement payment across multiple expense obligations using FIFO order
- **Trigger**: SettlementService.allocateExpenseShareSettlement
- **Data Flow**:
  1. User (payer/debtor) submits allocation details (payeeId, amount, currency, optional groupId)
  2. SettlementService validates inputs and idempotency key
  3. SettlementService begins database transaction
  4. SettlementService fetches allocatable expense_share records (FIFO order):
     - participantUserId = payerId (debtor)
     - payerUserId = payeeId (creditor)
     - status = UNPAID or PARTIALLY_PAID
     - isPayerShare = 0
     - matching currency and optional groupId
  5. Validates total outstanding ≥ allocation amount
  6. Creates transaction header and ledger entries
  7. Creates settlement record
  8. Iterates through shares in FIFO order:
     - For each share, applies amount = min(shareRemaining, remainingToAllocate)
     - Updates expense_share.paidAmount and status
     - Creates settlement_application record linking settlement to expense_share
     - Decrements remaining allocation amount
     - Continues until fully allocated or no more shares
  9. Updates bilateral user_balance through BalanceAdjustmentService
  10. Returns settlement details with applications and outstanding amounts
- **Tables & Records**:
  - `transaction`: Single row with {id, description: "Settlement allocation", userId: payerId}
  - `transaction_entry`: Two rows:
    - Row 1: {transactionId, transactionAccountId (payer's LOAN_TAKEN), amount: -amount}
    - Row 2: {transactionId, transactionAccountId (payee's LOAN_GIVEN), amount: +amount}
  - `settlement`: Single row with {id, payerId, payeeId, amount, currency, groupId (optional), transactionId, idempotencyKey, settledAt}
  - `expense_share`: Multiple rows updated:
    - For each affected share: paidAmount increased by applied amount
    - status updated to "PARTIALLY_PAID" or "PAID" based on whether full amount is paid
  - `settlement_application`: Multiple rows created:
    - One row per affected share: {id, settlementId, expenseShareId, appliedAmount}
  - `user_balance`: Two mirrored rows updated:
    - Row 1: {ownerId: payeeId, counterPartyId: payerId} amount decreased by settlement amount
    - Row 2: {ownerId: payerId, counterPartyId: payeeId} amount increased by settlement amount
- **W/R**: expense_share (update paidAmount/status), settlement (insert), settlement_application (insert), user_balance (update)
- Ledger: (Design gap) no transaction entries yet
- Algorithm: FIFO by realizedAt, id across debtor’s outstanding shares to a specific payer (+ optional group scope)
- Invariants: amount > 0; amount ≤ totalOutstanding + ε (ε≈1e-8); homogeneous currency & group; payerId != payeeId
- Result: Outstanding reduced; shares’ status transitions UNPAID → PARTIALLY_PAID → PAID
- Design Gap: Missing ledger parity (pending summarized or per-allocation entries)
- Settlement Approach: This allocation-based settlement is currently used only for expense shares, not for direct loans. Direct loans use the simpler reversal approach (5.4) with less granular tracking. This separation is intentional and aligns with the different user-facing concepts and typical settlement patterns.

### 5.7 Aggregation & Derived Views

- **Purpose**: Generate summary data and analytics from transaction history
- **Data Flow**:
  1. Query services (DashboardService, etc.) access base transaction tables
  2. Services apply aggregation logic based on account types and entry signs
  3. User interface presents summary views (totals, charts, trends)
- **Tables & Records** (Read-only):
  - `transaction` and `transaction_entry`: For raw transaction data
  - `expense_share`: For obligation tracking and settlement status
  - `user_balance`: For current net positions between users
- **Aggregation Rules**:
  - Income: SUM(positive amounts in INCOME accounts)
  - Expenses: SUM(positive amounts in EXPENSE accounts)
  - Savings: SUM(positive amounts in SAVING accounts)
  - Assets (Loans Given): NET SUM(all amounts in LOAN_GIVEN accounts)
  - Liabilities (Loans Taken): NET SUM(all amounts in LOAN_TAKEN accounts)
  - Net Worth: Assets - Liabilities

Layer interaction and derivability assumptions; reconciliation process (future) will assert user_balance consistency with obligations.

---

## 6. Expense Share Model

**Purpose**: Track individual obligations from shared expenses with settlement status

**Table**: `expense_share`

**Fields and Data Types**:

- `id` (integer, PK): Unique identifier
- `transactionId` (integer, FK): Reference to parent transaction
- `payerUserId` (integer, FK): User who paid for the expense
- `participantUserId` (integer, FK): User who owes a share (could be payer if isPayerShare=1)
- `groupId` (integer, FK, nullable): Optional group context
- `shareType` (text): FRIENDS | GROUP
- `splitType` (text): EQUAL | PERCENTAGE | SHARE
- `expenseAccountId` (integer, FK, nullable): Category account reference
- `currency` (text): Three-letter currency code
- `amount` (real): Original share amount
- `paidAmount` (real): Amount paid via settlements
- `status` (text): UNPAID | PARTIALLY_PAID | PAID
- `realizedAt` (timestamp): When obligation was created
- `isPayerShare` (integer): Flag for payer's own share (1=true, 0=false)
- `metadata` (JSON): Additional info about the share

**Record Creation**:

- Created during shared expense transaction
- One row per participant (plus optional payer share)
- paidAmount initialized to 0
- status initialized to UNPAID

**Record Updates**:

- paidAmount: Incremented during settlement allocation
- status: Transitions from UNPAID → PARTIALLY_PAID → PAID

**Key Relationships**:

- transaction: Parent expense
- transaction_account: Category (optional)
- user (payerUserId): Creditor
- user (participantUserId): Debtor
- settlement_application: Settlement allocations applied to this share

**Invariants**:

- 0 ≤ paidAmount ≤ amount
- Status monotonic: UNPAID → PARTIALLY_PAID → PAID
- isPayerShare=1 rows excluded from allocations
- Currency homogeneous per allocation request

**Usage Patterns**:

- Source for FIFO allocation algorithm
- Status tracking for obligations
- Settlement tracking and reporting

---

## 7. Settlement Allocation Details (Updated: Idempotency & Concurrency Semantics)

Endpoint: POST /api/v1/settlements/allocate (Idempotent via Idempotency-Key header)
Inputs: payeeId, (implicit payerId = auth user), amount, currency, optional groupId
Validation: payerId != payeeId; amount > 0; at least one allocatable share (participantUserId=payerId, payerUserId=payeeId, status in {UNPAID, PARTIALLY_PAID}, isPayerShare=0) matching currency/group; amount ≤ totalOutstanding + ε
Algorithm (pseudo):

```
shares = fetchAllocatableShares(... FIFO)
outstandingBefore = Σ(shareRemaining)
assert amount ≤ outstandingBefore
create settlement
remaining = amount
for share in shares while remaining>0:
  apply = min(shareRemaining, remaining)
  update share (paidAmount += apply, status= PAID if ≈ amount else PARTIALLY_PAID)
  insert settlement_application
  remaining -= apply
update user_balance mirrored rows (+/- totalApplied)
outstandingAfter = outstandingBefore - amount
return settlement + applications + totals
```

User Balance Adjustments:

- Row(owner=payeeId, counterParty=payerId) decreases by applied amount
- Reciprocal row(owner=payerId, counterParty=payeeId) increases by applied amount
  Precision:
- 1e-8 tolerance for classification as fully paid
  Error Scenarios (400): self settlement, non-positive amount, no outstanding shares, over-allocation
  Concurrency & Idempotency:
- Entire allocation processed in a single DB transaction.
- Idempotency-Key header REQUIRED. First request with a key creates settlement (HTTP 200) and persists key + hashed payload reference; exact replay with same payload returns existing settlement (HTTP 200). Any differing payload reuse of the key causes conflict (HTTP 409).
- Direct (legacy) settlement endpoints (/api/v1/balances, /api/v1/groups/{groupId}/settlements) also require Idempotency-Key: first use 201 Created, subsequent exact replay 200 OK, mismatch 409 Conflict.
- Allocation always 200 (even on first creation) to simplify client logic (idempotent PUT-like semantics); legacy direct settlements retain 201 for initial creation.
- Current concurrency window: two parallel allocations for same (payer, payee, group?) pair could interleave and slightly over-allocate within ε; mitigation pending (future row-level locking or logical mutex keyed by payer-payee-[group]).
  Ledger Gap:
- No double-entry representation yet; future: per-allocation or summarized ledger entries

Comparison (Legacy vs Allocation):
| Aspect | Legacy Direct Settlement | Allocation Flow |
|--------|--------------------------|-----------------|
| Granularity | Single debt reversal | Multi-expense FIFO |
| Ledger Entries | Yes (double-entry) | Not yet (gap) |
| Partial Allocation | By splitting settlement amount | Native per-share partials |
| Share Status Tracking | Implicit via loans | Explicit (UNPAID/PARTIALLY_PAID/PAID) |
| Flexibility | Limited | High |
| Recommended Use | Backward compatibility, Direct Loans | Primary path for Expense Shares |
| Domain Fit | Better for simple loans | Better for expense obligations |
| Implementation Consistency | Consistent with loan model | Consistent with expense_share model |

---

## 8. Category Derivation

Category for an expense/settlement is derived from the positive transaction entry’s account name; fallback GENERAL if none.

---

## 9. Loan Transaction Validation (Canonical Rules)

Rules enforced by LoanService:

1. Exactly one split
2. Split amount == transaction amount (payerTotal == 0)
3. Source account = payer’s LOAN_GIVEN
4. Destination account = split user’s LOAN_TAKEN
5. Type must be LOAN_GIVEN (LOAN_TAKEN creation rejected)
6. Distinct users

Symmetric endpoint (/loans/symmetric) applies same core invariants implicitly.

---

## 10. Interpersonal Debt Engine

Methods: recordDirectLoan, recordRepayment
Semantics:

- Positive loan increases creditor’s net position; reciprocal negative for debtor
- Repayment decreases outstanding (applies negative delta)
  Invariants: creditorId != debtorId; amount > 0; groupId optional scoping; currency pass-through (no FX normalization yet)
  Deferred: ledger emission, idempotency boundary logic, outstanding validation, FX

---

## 11. Recurring Item Flows

- Income (CREDIT): EXTERNAL (-) → INCOME (+)
- Expense (DEBIT): OUTGOING (-) → EXPENSE (+)
- Saving (DEBIT): OUTGOING (-) → SAVING (+)

---

## 12. Aggregation Logic (Analytics)

- Income: SUM(positive INCOME entries)
- Expenses: SUM(positive EXPENSE entries)
- Savings: SUM(positive SAVING entries)
- Assets (Loans Given): Net sum LOAN_GIVEN
- Liabilities (Loans Taken): Net sum LOAN_TAKEN
- Net Worth: Assets - Liabilities

---

## 13. User Balance System

user_balance schema: (ownerId, counterPartyId, groupId nullable, amount, currency)
Semantics: +amount means counterParty owes owner; -amount owner owes counterParty
Two mirroring rows per relationship (overall and group-specific as applicable) updated in real time for loans, shared expenses, allocations, and legacy settlements.

---

## 14. Legacy Expense & Settlement Details (For Reference)

Legacy Expense Creation (pre-expense_share) included constructing loan relationships from splits; now superseded by explicit expense_share obligations. Legacy direct settlement performs immediate loan reversal entries and updates user_balance; lacks allocation granularity and outstanding capping (except where later guarded in service logic). Detailed legacy DB operations (transaction header, two ledger entries, mirrored user_balance updates, settlement audit row) remain for backward compatibility but are not the canonical repayment path.

---

## 15. Implementation Architecture

### 15.1 Services

- ExpenseService: Creates expenses + shares + associated ledger entries
- SettlementService: Allocation flow + (legacy) debt settlement orchestration
- BalanceService: Direct loan & settlement (legacy) abstractions
- LoanService: Canonical loan creation/update/delete/fetch
- TransactionHelperService: Double-entry construction & account updates
- DashboardService: Aggregations & summaries
- AuthService: User authentication & account initialization
- GroupService / FriendService: Social + membership context

### 15.2 Design Patterns

- Repository pattern for data access
- Service layer for business logic
- Dependency Injection (Awilix) for request-scoped service resolution
- Separation of concerns (handlers only parse and delegate)

### 15.3 Transaction Management

All multi-write operations execute within an explicit transaction propagated via optional tx parameter; nested service calls reuse existing tx.
Pattern:

```ts
await db.transaction(async (tx) => {
  // repository calls with tx
});
```

Repository signature:

```ts
async method(params, tx?: DBTransactionType): Promise<Result>
```

### 15.4 Error Handling & Validation

Categories:

- Validation (400)
- Not Found (404)
- Authentication (401) / Authorization (current simplification sometimes 400; future 403 distinction)
- Constraint / Internal (500)
  Handlers: parse + delegate + shape error; services own domain validation.

### 15.5 Security & Access (Current Rules)

- Direct loan creation: authenticated user (creditor) + debtor must be friend OR co-member of groupId if provided
- Loan fetch/update/delete: creator-only (future participant visibility)
- Allocation: debtor (payer) paying original creditor; future stricter group membership enforcement
- Symmetric endpoint inherits same access controls

---

## 16. API Surface (Current – High-Level Excerpt)

NOTE: Full authoritative per-endpoint listing maintained in API_ROUTES.md. This section only highlights core loan & allocation surfaces.

POST /api/v1/loans/symmetric Create direct loan (canonical convenience path; implicit single debtor split)
GET /api/v1/loans List loans (creator scope; participant extension future)
GET /api/v1/loans/{loanId} Get loan details (creator)
PUT /api/v1/loans/{loanId} Update loan (description, loanDate)
DELETE /api/v1/loans/{loanId} Delete loan (creator)
POST /api/v1/settlements/allocate Allocate repayment across expense shares (FIFO)
(Legacy settlement endpoints retained but not canonical)

Allocation Response Shape (conceptual):

```
{
  settlement: {...},
  applications: [{ expenseShareId, appliedAmount, ... }],
  totalApplied: number,
  outstandingBefore: number,
  outstandingAfter: number
}
```

### 16.1 Idempotency & Concurrency Summary

Key Principles:

- Idempotency-Key header REQUIRED for: POST /api/v1/settlements/allocate, POST /api/v1/balances (legacy), POST /api/v1/groups/{groupId}/settlements (legacy)
- Key uniqueness scope: (userId, idempotencyKey, endpoint)
- First request persists canonical record + normalized payload hash
- Exact replay (same key + identical normalized payload) returns 200 (allocation) or 200 (legacy uses 201 on first, 200 on replay) without duplication
- Mismatched payload reuse => 409 Conflict (no side effects)

Status Codes:

- Allocation: 200 on creation and repeat
- Legacy direct settlements: 201 Created first, 200 OK subsequent

Concurrency:

- Single DB transaction wraps each settlement / allocation
- No pessimistic locking yet; parallel allocations between same payer/payee[/group] may slightly over-allocate within ε (1e-8) before future mutex/locking

Determinism & Hashing:

- Payload normalization: sorted JSON keys, trimmed strings, numeric amount canonicalized to string with up to 8 decimal places before hashing (implementation detail; see SettlementService)

Future Work:

- Introduce row-level or advisory locks to prevent parallel over-allocation
- Expand idempotency to loan creation and future AI transaction endpoint if client retries become common

---

## 17. Known Gaps (Non-Flag Form)

- Allocation ledger parity absent (no transaction entries yet)
- Concurrency protection for parallel allocations pending (row locks / mutex)
- Reconciliation utility (derive & compare user_balance vs obligations) pending
- Share listing / filtering endpoints for richer obligation queries pending
- Zero-balance row pruning optimization not implemented
- Multi-currency normalization & FX handling deferred
- Optional summarized or per-allocation ledger emission design pending

---

## 18. Recently Standardized (Informational)

- Canonical loan direction unified (LOAN_GIVEN only)
- Bilateral balance mutation path centralized (applyBilateralDelta) ensuring consistent sign semantics (creditor positive / debtor negative)
- Upfront expense obligation recognition via expense_share replaces implicit split-based outstanding derivation

---

## 19. Planned Enhancements (High-Level)

- Ledger entries for allocation (micro vs summarized strategy)
- Reconciliation & audit tooling
- Concurrency controls for allocation (row locking / logical mutex)
- Multi-currency normalization / functional currency support
- Share query & participant/ payer filtering endpoints
- Enhanced OpenAPI/contract coverage & SDK generation
- Advanced transaction indexing + performance tuning
- Real-time balance sync refinements

---

## 20. Document Scope

This LLD is authoritative for current domain architecture and flows. It merges prior detailed and concise versions without log-style flag annotations. Historical change rationale resides in version control history.

---

## 21. Database Schema Overview & Table Roles

This section provides a concise overview of all current tables (21.1–21.6) and their relationships, followed by an authoritative Table Role Catalog (21.10) that defines each table’s architectural role, mutability, invariants, and rationale. Use 21.10 as the single source of truth for refactors and audits.

Legend:

- PK primary key (auto-increment integer unless noted)
- FK -> referenced_table.column
- Optional fields noted (nullable)
- Cardinality examples: User 1..\* Transaction (a user creates many transactions)

### 21.1 Auth & Identity

1. user
   - Purpose: Core identity & profile; default currency preference.
   - Key Fields: id (PK), name, email (unique), currency.
   - Relationships:
     - 1..\* account, session, verification
     - 1..\* transaction_account
     - 1..\* transaction (creator)
     - 1..\* budget, recurring
     - 1..\* loan (createdBy)
     - 1..\* group (createdBy)
     - 1..\* group_member (membership rows)
     - 1..\* friendship (as userId1 or userId2)
     - 1..\* expense_share (as payerUserId or participantUserId)
     - 1..\* settlement (as payerId or payeeId)
     - 1..\* loan_split (participant / debtor)
     - 1..\* user_balance (as ownerId or counterPartyId)

2. account
   - Purpose: OAuth / external auth provider linkage.
   - FKs: userId -> user.id

3. session
   - Purpose: Auth session/token persistence.
   - FKs: userId -> user.id

4. verification
   - Purpose: Email / credential verification tokens.

### 21.2 Social & Context

5. friendship
   - Purpose: Bilateral relationship enabling direct loans & shared expenses outside groups.
   - Fields: userId1, userId2, status (PENDING|ACCEPTED).
   - Unique Index: (userId1, userId2, status) prevents duplicates.
   - Cardinality: user 1..\* friendship (two roles; app logic enforces ordering / normalization outside schema).

6. group
   - Purpose: Container for shared expenses & scoped balances.
   - FKs: createdBy -> user.id

7. group_member
   - Purpose: Membership mapping.
   - FKs: groupId -> group.id, userId -> user.id
   - Cardinality: group 1.._ group_member; user 1.._ group_member.

### 21.3 Core Ledger & Accounts

8. transaction_account
   - Purpose: Represents a user-owned categorization or financial account (EXPENSE, INCOME, LOAN_GIVEN, LOAN_TAKEN, SAVING, EXTERNAL, OUTGOING).
   - FKs: userId -> user.id
   - Notes: balance column currently present (materialized / auxiliary); double-entry integrity enforced at service layer, not by constraint.

9. transaction
   - Purpose: Logical ledger event header (descriptive metadata & date) created by a user (creator context / initiating actor).
   - FKs: userId -> user.id
   - Cardinality: transaction 1..\* transaction_entry; (some flows also spawn expense_share, loan, etc.).

10. transaction_entry
    - Purpose: Immutable double-entry line items linking a transaction to specific accounts.
    - FKs: transactionId -> transaction.id, transactionAccountId -> transaction_account.id
    - Invariant: Sum(amount for a transaction) == 0 (enforced in service layer).

### 21.4 Budgeting & Recurrence

11. budget
    - Purpose: Per-account periodic spending target.
    - FKs: userId -> user.id, transactionAccountId -> transaction_account.id

12. recurring
    - Purpose: Template for automated periodic postings (income, expense, saving transfers).
    - FKs: userId -> user.id, sourceTransactionAccountID -> transaction_account.id, targetTransactionAccountID -> transaction_account.id

### 21.5 Loans, Obligations, Settlements & Balances

13. loan (Canonical direct loan header)
    - Purpose: Represents a bilateral loan (currently exactly one debtor split required in canonical path).
    - FKs: groupId (optional) -> group.id; createdBy -> user.id; transactionId -> transaction.id
    - Notes: transaction references the ledger posting LOAN_GIVEN (-) → LOAN_TAKEN (+).

14. loan_split
    - Purpose: Participant obligation rows for a loan (canonical direct loans: exactly one row for the debtor; model supports multi-debtor extension).
    - FKs: loanId -> loan.id; userId -> user.id
    - Fields: amountOwed, splitType (EQUAL | PERCENTAGE | SHARE), metadata (JSON).

15. expense_share
    - Purpose: Upfront recognition of each participant’s obligation for a shared expense (plus optional payer share row marked isPayerShare=1).
    - FKs: transactionId -> transaction.id; payerUserId -> user.id; participantUserId -> user.id; groupId (optional) -> group.id; expenseAccountId (optional) -> transaction_account.id
    - Notes: Basis for allocation (repayment) workflow; paidAmount and status track settlement progress.

16. settlement
    - Purpose: A repayment event (either legacy direct loan reversal or canonical allocation event header). For allocation-based repayment, it groups multiple applications.
    - FKs: groupId (optional) -> group.id; payerId -> user.id; payeeId -> user.id; transactionId (optional currently) -> transaction.id
    - Fields: amount, currency, idempotencyKey (optional), settledAt.

17. settlement_application
    - Purpose: Junction table allocating a settlement’s amount to specific expense_share rows FIFO.
    - FKs: settlementId -> settlement.id; expenseShareId -> expense_share.id
    - Cardinality: settlement 1.._ settlement_application; expense_share 0.._ settlement_application.

18. user_balance
    - Purpose: Materialized bilateral net position between two users (optionally scoped by group). Mirrors are maintained (owner/counterParty swapped).
    - FKs: ownerId -> user.id; counterPartyId -> user.id; groupId (optional) -> group.id
    - Semantics: amount > 0 means counterParty owes owner; amount < 0 inverse.

### 21.6 Ancillary / Misc

19. student
    - Purpose: Example / test table (not part of core domain flows). Safe to ignore for production logic.

### 21.7 Cross-Domain Relationship Graph (Conceptual) (See also Section 21.10 for authoritative role semantics)

User → (creates) Transaction → (has many) TransactionEntry → (references) TransactionAccount (owned by User)
Shared Expense Flow: Transaction (payer initiated) → ExpenseShare (one per participant) → (later) Settlement → SettlementApplication → ExpenseShare (status/paidAmount updated)
Loan Flow: Transaction → Loan (header) → LoanSplit (debtor obligation) → Settlement / Allocation adjusting UserBalance
Bilateral Netting: ExpenseShare & Loan & Settlement(Allocation) mutate UserBalance (mirrored rows) via service-layer delta application.

### 21.8 Integrity & Derivability Notes

- user_balance must be recomputable from (Σ recognized obligations per pair - Σ allocations / repayments) once allocation entries have ledger parity (future work).
- loan_split currently single-row canonical; schema supports future multi-split loans (would then behave more like expense_share but without payer share concept).
- settlement_application provides auditable replay to confirm paidAmount in each expense_share (paidAmount == Σ appliedAmount where expenseShareId matches).
- Legacy direct settlements produce ledger entries (via transaction) whereas allocation settlements presently do not (gap listed in Known Gaps).

### 21.9 Potential Future Schema Evolutions

- Introduce ledger entries for allocation: either one summarized LOAN_TAKEN → LOAN_GIVEN per settlement or granular per expense_share application.
- Add unique composite index on user_balance (ownerId, counterPartyId, groupId, currency) to enforce singular row per dimension (if not already at migration layer).
- Add status or soft-delete flags for logical archival (loans, expense shares) once fully settled.
- Introduce dedicated reconciliation_snapshot table for periodic balance audits.
- Add FX rate reference table if multi-currency normalization proceeds.

---

## 21.10 Table Role Catalog (Authoritative & Explicit)

This catalog supersedes the brief descriptions in Section 21 for the purpose of clearly stating the ROLE of each table (why it exists, what layer it belongs to, and how it is used). Use this section when reasoning about ownership, mutability, derivation, auditing, and future refactors.

Role Type Glossary:

- SourceOfTruth: Canonical authoritative data; other tables may derive from it.
- ImmutableFact: Append-only facts (no updates after insert) – ledger correctness & audit.
- EventHeader: Grouping meta for a set of fact rows (can allow minor edits like description/date).
- AuditMapping: Provides verifiable linkage (e.g., allocation mapping) – immutable.
- Derived / MaterializedSummary: Performance-oriented projection recomputable from sources.
- TransitionalLegacy: Kept only for backward compatibility / migration; target for deprecation.
- Auxiliary: Support/lookup/metadata not central to financial semantics.
- Ephemeral: Short‑lived auth / verification data (time-bound or consumable).

Legend for fields below:
Layer: Architectural / domain layer bucket
Primary Writers: Services that create/update rows
Mutability: Immutable | AppendOnly | Semi (restricted) | Mutable
Deletes: Hard | Cascade | Logical (future) | Rare | N/A
Key FKs: Principal foreign keys (direction shows dependency)
Invariants: Critical correctness constraints (enforced in code if not DB)
Why Exists: Concise rationale for existence

---

### 21.10.1 Auth & Identity

Table: user
Layer: Auth
Role: SourceOfTruth (principal identity)
Primary Writers: AuthService
Mutability: Mutable (profile fields)
Deletes: Hard (cascades to dependent rows via FKs)
Key FKs: (referenced by many tables)
Invariants: email unique; currency default always set
Why Exists: Anchor entity for all ownership, permissions, balances.

Table: account
Layer: Auth
Role: Auxiliary (OAuth / external linkage)
Primary Writers: AuthService
Mutability: Semi (tokens rotate)
Deletes: Hard
Key FKs: userId -> user
Invariants: provider scoped uniqueness (enforced in higher layer)
Why Exists: Persist provider credentials separate from core identity.

Table: session
Layer: Auth
Role: Ephemeral (auth session)
Primary Writers: AuthService
Mutability: Semi (expiresAt refresh)
Deletes: Hard (logout / expiry cleanup)
Key FKs: userId -> user
Invariants: token unique; expiresAt > now on creation
Why Exists: Stateful session continuity for API.

Table: verification
Layer: Auth
Role: Ephemeral (verification token)
Primary Writers: AuthService
Mutability: AppendOnly (practically) / removable on consume
Deletes: Hard (after use / expiry)
Why Exists: Decouple verification flows from user table.

---

### 21.10.2 Social & Context

Table: friendship
Layer: Social
Role: SourceOfTruth (relationship gate)
Primary Writers: FriendService
Mutability: Semi (status transitions PENDING→ACCEPTED)
Deletes: Hard (unfriend)
Invariants: (userId1,userId2,status) unique; reflexive duplicates prevented in service
Why Exists: Authorizes out-of-group bilateral financial interactions.

Table: group
Layer: Social
Role: SourceOfTruth (collaboration scope)
Primary Writers: GroupService
Mutability: Mutable (name, coverPhotoURL)
Deletes: Hard (cascades)
Why Exists: Scopes shared expenses & group-specific balances.

Table: group_member
Layer: Social
Role: SourceOfTruth (membership join)
Primary Writers: GroupService
Mutability: Append/Delete (join/leave)
Deletes: Hard (on group or user removal)
Invariants: (groupId,userId) uniqueness (implicit/enforced at service)
Why Exists: Determines visibility and permission to create group expenses / loans.

---

### 21.10.3 Ledger Core

Table: transaction
Layer: Ledger
Role: EventHeader
Primary Writers: TransactionService, ExpenseService, LoanService, BalanceService (legacy), (future) SettlementService
Mutability: Semi (description/date edits allowed)
Deletes: Hard (only via cascading when entire flow rolled back; normally not deleted)
Invariants: At least 2 transaction_entry rows expected; semantic type inferred by entry account types
Why Exists: Provides grouping + narrative metadata for atomic ledger entries.

Table: transaction_entry
Layer: Ledger
Role: ImmutableFact (double-entry line)
Primary Writers: Above services via helper
Mutability: Immutable
Deletes: Hard only if parent transaction deleted
Invariants: Sum(amount) per transaction == 0; exactly two lines for current flows (may expand later)
Why Exists: Core atomic monetary truth; audit base.

Table: transaction_account
Layer: Ledger
Role: SourceOfTruth (chart of accounts per user)
Primary Writers: Account setup logic / services
Mutability: Mutable (name, payment source flag)
Invariants: Type constrained; balance adjustments consistent with entries
Why Exists: Categorization & separation of financial flows; mapping for analytics.

---

### 21.10.4 Budgeting & Recurrence

Table: budget
Layer: Budgeting
Role: SourceOfTruth
Primary Writers: BudgetService
Mutability: Mutable
Invariants: amount > 0; period enum valid
Why Exists: Drive spending analytics targets.

Table: recurring
Layer: Budgeting
Role: SourceOfTruth (schedule template)
Primary Writers: RecurringService
Mutability: Mutable (nextDate progression)
Invariants: amount > 0; period & type valid
Why Exists: Automates periodic postings (income/expense/saving).

---

### 21.10.5 Loans

Table: loan
Layer: Loan
Role: SourceOfTruth (loan header)
Primary Writers: LoanService
Mutability: Semi (description, loanDate)
Invariants: amount > 0; matches loan_split aggregate; single-split canonical current
Why Exists: Persistent identity & metadata of a direct loan event.

Table: loan_split
Layer: Loan
Role: SourceOfTruth (participant obligation)
Primary Writers: LoanService
Mutability: Immutable (post creation)
Invariants: Σ(amountOwed) == loan.amount; userId != creator for debtor row
Why Exists: Structured support for multi-party extension & explicit debtor obligation.

---

### 21.10.6 Shared Expense & Allocation

Table: expense_share
Layer: Obligation
Role: SourceOfTruth (explicit obligation)
Primary Writers: ExpenseService
Mutability: Semi (paidAmount/status progress only)
Invariants: 0 ≤ paidAmount ≤ amount; status monotonic; isPayerShare excludes row from allocation
Why Exists: Canonical outstanding representation enabling auditable allocations.

Table: settlement
Layer: Allocation
Role: EventHeader (repayment action)
Primary Writers: SettlementService, BalanceService (legacy variant)
Mutability: Immutable core (except updatedAt)
Invariants: amount > 0; payerId != payeeId; currency stable
Why Exists: Groups allocation applications and future ledger parity entries.

Table: settlement_application
Layer: Allocation
Role: AuditMapping
Primary Writers: SettlementService
Mutability: Immutable
Invariants: appliedAmount > 0; sum across applications == settlement.amount; each <= share remaining at allocation time
Why Exists: Traceable mapping from settlement to exact obligation reductions.

---

### 21.10.7 Materialized Summary

Table: user_balance
Layer: Materialized
Role: Derived / MaterializedSummary
Primary Writers: ExpenseService, LoanService, SettlementService
Mutability: Mutable (amount updates)
Invariants: Mirror pair rows (A,B) == -(B,A); currency consistent per pair; recalculable from sources
Why Exists: Fast UI & analytic access to net positions without recomputing obligations each request.

---

### 21.10.8 Ancillary

Table: student
Layer: Ancillary / Test
Role: Auxiliary (demo)
Primary Writers: Test utilities / demo code
Mutability: Mutable
Why Exists: Non-domain scaffold (safe to remove in production environments).

---

### 21.10.9 Relationship Adjacency (Directional Summaries)

user -> transaction_account (1:N)
user -> transaction (1:N)
transaction -> transaction_entry (1:N)
transaction -> loan (1:0..1) (loan has mandatory transactionId)
loan -> loan_split (1:N)
transaction -> expense_share (1:0..N)
expense_share -> settlement_application (1:0..N)
settlement -> settlement_application (1:N)
(user A, user B [, group]) -> user_balance (materialized pair rows)
settlement (allocation) -> (future) transaction (when ledger parity added)

---

### 21.10.10 Derivation Map

Source Layers: transaction_entry, expense_share, loan_split, settlement_application
Materialized: user_balance = f(loans + shared expense obligations - allocations/repayments)
Legacy Influence: legacy settlement transaction entries (no longer present in the codebase)

---

### 21.10.11 Deprecation Targets & Migration Notes

- Add allocation ledger entries: settlement will always have transactionId (NOT NULL) referencing summarized or granular entries.
- Potential introduction of reconciliation_snapshot: periodic derived audit table (Derived, AppendOnly).

---

### 21.10.12 Quick Audit Checklist (Per Table Type)

ImmutableFact: Ensure no UPDATE statements (transaction_entry, settlement_application, loan_split)
SourceOfTruth: Validate domain invariants before insert/update (loan, expense_share, transaction_account)
Derived: Recomputability test (periodic reconciliation for user_balance)
EventHeader: Must have ≥1 child fact/application row (transaction, settlement, loan)
AuditMapping: Must align sums with parent header (settlement_application vs settlement)

---

(End of Section 21.10)

End of Document.
