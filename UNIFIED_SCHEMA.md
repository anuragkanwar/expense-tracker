# Unified Schema Approach

## Overview

This document explains the unified schema approach implemented in this project, specifically how the separate `loan` and `loan_split` tables have been consolidated into the `expense_share` schema.

## Background

Previously, the application used separate tables for tracking different types of financial obligations:

- `loan` table for tracking direct loans between users
- `loan_split` table for tracking the details of loan splitting
- `expense_share` table for tracking expense sharing

This led to duplication of code, difficulty in maintaining consistency across these similar but separate data structures, and complicated queries when trying to get a complete picture of a user's financial obligations.

## The Unified Schema

To address these issues, we've implemented a unified schema approach with the following characteristics:

### 1. Single Table for All Obligations

The `expense_share` table now serves as the single source of truth for all financial obligations between users, including:

- Expense shares (e.g., splitting a dinner bill)
- Direct loans (e.g., lending money to a friend)

### 2. Type Differentiation

Obligations are differentiated by the `type` field:

- `EXPENSE` for expense shares
- `LOAN` for direct loans

### 3. Flexible Structure

The unified schema includes fields that support both expense shares and loans:

- Core financial fields: `amount`, `currency`, `status`, `paidAmount`
- Relationship fields: `payerUserId` (creditor in loans), `participantUserId` (debtor in loans)
- Context fields: `groupId`, `transactionId`, `description`
- Temporal fields: `realizedAt`, `loanDate`
- Special fields: `isPayerShare`, `metadata` (for additional type-specific data)

### 4. API Compatibility

To maintain backward compatibility with existing clients:

- The existing loan API endpoints continue to work, but now use the unified schema internally
- The `LoanResponseSchema` is maintained for API response compatibility
- The service layer handles the mapping between the unified schema and the loan-specific response format

## Benefits

1. **Simplified Data Model**: One table instead of three for similar concepts
2. **Consistent Business Logic**: Consolidated service methods for creating and managing financial obligations
3. **Unified Queries**: Easier to get a complete picture of a user's financial situation
4. **Reduced Code Duplication**: DRYer codebase with less repetition across similar entities
5. **Better Performance**: Fewer joins needed for common queries
6. **Easier Maintenance**: Changes to the obligation structure only need to be implemented in one place

## Implementation Notes

### Repository Layer

- The `ExpenseShareRepository` now includes methods specifically for loan operations
- Methods like `createLoan`, `findLoanById`, and `updateLoan` handle loan-specific operations
- A `mapToLoanResponse` method handles the transformation of the unified schema to loan-specific response format

### Service Layer

- The `LoanService` is kept for API compatibility but now works with the unified schema
- Business logic for loans is still isolated in the loan service for maintainability

### Schema Design Considerations

- The `type` field ensures clear differentiation between different obligation types
- Additional fields specific to loans (like `loanDate`) are nullable for expense shares
- The `metadata` JSON field allows for storing type-specific additional data without schema changes

## Future Considerations

1. **Enhanced Dashboards**: With a unified schema, we can now build more comprehensive dashboards showing all financial obligations
2. **Simplified Settlement**: A unified approach to settling different types of financial obligations
3. **Batch Operations**: Easier to implement batch operations across different obligation types
4. **New Obligation Types**: The unified schema makes it easier to add new types of financial obligations in the future

## Migration

For development purposes, we've completely removed the old loan schema files since we're not yet in production. In a production environment, we would have implemented a proper migration strategy to move data from the old tables to the unified schema.
