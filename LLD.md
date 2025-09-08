# Low Level Design (LLD) - Pocket Pixie

## Overview

Pocket Pixie is a comprehensive financial management application supporting individual and group expense tracking with advanced settlement capabilities. The system uses double-entry accounting to ensure financial integrity and provides real-time balance calculations.

## Core Architecture Principles

### Double-Entry Accounting System

- **Every transaction affects two accounts** with equal but opposite amounts
- **Maintains financial integrity** through balanced entries
- **Supports complex operations** like settlements, loans, and group expenses

### Data Sources

- **Transaction Entries**: Primary source for all financial calculations
- **User Balance Table**: Materialized view of net debt between users (performance optimization)
- **Expense/Split Tables**: Metadata for group expense relationships

## Transaction System Architecture

### Core Concepts

- **Account Types**: INCOME, EXPENSE, OUTGOING, LOAN_GIVEN, LOAN_TAKEN, EXTERNAL, SAVING
- **Sign Convention**: Positive amounts = money coming in, Negative amounts = money going out
- **Aggregation Strategy**: Sum only positive amounts per account type

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

### Key Transaction Flows

1. **Expense Recording**: `OUTGOING (-) → EXPENSE (+)`
2. **Income Recording**: `EXTERNAL (-) → INCOME (+)`
3. **Saving**: `OUTGOING (-) → SAVING (+)`
4. **Loan Creation**: `LOAN_GIVEN (-) → LOAN_TAKEN (+)`
5. **Settlement**: Reverses loan relationships + records payment

### Loan Transaction Validation Rules

**For LOAN_GIVEN and LOAN_TAKEN transactions, strict validation is applied:**

1. **Split Requirements**:
   - Must have exactly one split entry in the `splits` array
   - The split amount must exactly match the transaction amount

2. **Account Validation**:
   - **Source Account**: Must be the payer's `LOAN_GIVEN` account
   - **Destination Account**: Must be the split user's `LOAN_TAKEN` account

3. **Transaction Type Specific Rules**:
   - **LOAN_GIVEN**: Source account belongs to payer, destination account belongs to split user
   - **LOAN_TAKEN**: Source account belongs to split user, destination account belongs to payer

4. **Business Logic**:
   - Loans can only be created between two users (payer and one split user)
   - Prevents invalid account combinations and ensures proper loan relationship tracking

### Recurring Item Flows

1. **Income (CREDIT)**: `EXTERNAL (-) → INCOME (+)`
   - Money comes from external sources to user's income account
   - Always uses the single INCOME account

2. **Expense (DEBIT)**: `OUTGOING (-) → EXPENSE (+)`
   - Money goes from user's cash to specific expense category
   - User chooses from multiple EXPENSE accounts

3. **Saving (DEBIT)**: `OUTGOING (-) → SAVING (+)`
   - Money goes from user's cash to savings account
   - Always uses the single SAVING account

### Aggregation Logic

- **Income**: `SUM(amount > 0)` from INCOME accounts
- **Expenses**: `SUM(amount > 0)` from EXPENSE accounts
- **Savings**: `SUM(amount > 0)` from SAVING accounts
- **Assets**: `SUM(amount > 0)` from LOAN_GIVEN accounts
- **Liabilities**: `SUM(amount > 0)` from LOAN_TAKEN accounts
- **Net Worth**: Assets - Liabilities

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
- **Real-time updates**: Modified on loan creation and settlement
- **Performance critical**: Enables fast UI balance displays

## Group Expense & Settlement System

### Expense Creation Flow

1. **Payer Expense**: `OUTGOING (-) → EXPENSE (+)` for payer's share
2. **Loan Generation**: `LOAN_GIVEN (-) → LOAN_TAKEN (+)` for each participant
3. **Balance Updates**: Update user_balance table to reflect loan relationships
4. **Metadata Storage**: Expense and split records in relational tables

### Settlement Flow

1. **Debt Reversal**: `LOAN_TAKEN (-) → LOAN_GIVEN (+)` to negate original loan
2. **Payment Recording**: `OUTGOING (-) → EXPENSE (+)` to record cash movement
3. **Settlement Record**: Stored for audit trail

### Balance Update Flow

For each participant in a shared expense:

1. **Payee Balance**: `payee (owner) owes payer (counterparty) -amount`
2. **Payer Balance**: `payer (owner) is owed by payee (counterparty) +amount`
3. **Group Context**: If expense is group-based, balances are tracked per group
4. **Overall Balance**: Non-group balances are also maintained for cross-context settlements

### Key Features

- **Multi-party splits**: Complex group expense distribution
- **Flexible settlements**: Partial and full debt resolution
- **Direct loan support**: Non-group loan scenarios
- **Consistent Balance Tracking**: Both transaction entries and user balances updated

## Implementation Architecture

### Service Layer

- **ExpenseService**: Manages expense creation with automatic loan generation
- **SettlementService**: Processes debt settlements with transaction integrity
- **BalanceService**: Handles direct loans/settlements with transaction entries
- **DashboardService**: Provides aggregated financial analytics

### Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: Loose coupling
- **Transaction Management**: Atomic financial operations

### Critical Integration Fix

**Issue**: Direct loans/settlements and shared expenses only updated user_balance table or transaction entries respectively, breaking aggregation consistency.

**Resolution**: Ensured both transaction entries and user_balance updates for all financial activities:

- **Direct loans**: Create `LOAN_GIVEN (-) → LOAN_TAKEN (+)` entries + update user_balance
- **Direct settlements**: Create payment + loan reversal entries + update user_balance
- **Shared expenses**: Create `LOAN_GIVEN (-) → LOAN_TAKEN (+)` entries + update user_balance
- **Consistent aggregation**: All activities now maintain both transaction integrity and balance consistency

## Current Implementation Status

### ✅ Completed Features

- Double-entry accounting system with transaction integrity
- Group expense creation with automatic loan relationship generation
- Settlement flow with debt reversal and payment recording
- Direct loan/settlement integration with transaction system
- Dashboard analytics with category-based spending analysis
- Budget tracking and utilization calculations
- Recurring expense management with priority scheduling
- Net worth trend analysis with historical tracking
- Advanced transaction reporting (passbook) with filtering and pagination

### 🔄 In Progress

- Mobile application integration optimization

### 🎯 Future Enhancements

- Multi-currency support
- Advanced budgeting with forecasting
- Integration with external financial institutions
- AI-powered spending insights and recommendations

---

_This LLD serves as the architectural foundation for Pocket Pixie. For detailed API specifications, see the OpenAPI documentation at `/docs`._
