# API Verification Plan

## Overview

This document outlines the plan to verify that all API endpoints (using the expense_share schema) maintain the same contract and functionality as their original counterparts. The goal is to ensure a seamless transition for client applications when migrating from the original endpoints to the new endpoints.

## API Endpoints to Verify

### 1. Loan Endpoints

| Original Endpoint                 | New Endpoint                      | Method | Description          |
| --------------------------------- | --------------------------------- | ------ | -------------------- |
| `/api/v1/loans/symmetric`         | `/api/v1/loans/symmetric`         | POST   | Create a direct loan |
| `/api/v1/loans`                   | `/api/v1/loans`                   | GET    | List loans           |
| `/api/v1/loans/:loanId`           | `/api/v1/loans/:loanId`           | GET    | Get loan details     |
| `/api/v1/loans/:loanId`           | `/api/v1/loans/:loanId`           | PUT    | Update loan          |
| `/api/v1/loans/:loanId`           | `/api/v1/loans/:loanId`           | DELETE | Delete loan          |
| `/api/v1/groups/:groupId/loans`   | `/api/v1/groups/:groupId/loans`   | GET    | List group loans     |
| `/api/v1/friends/:friendId/loans` | `/api/v1/friends/:friendId/loans` | GET    | List friend loans    |

### 2. Transaction Endpoints

| Original Endpoint                      | New Endpoint                           | Method | Description         |
| -------------------------------------- | -------------------------------------- | ------ | ------------------- |
| `/api/v1/transactions`                 | `/api/v1/transactions`                 | POST   | Create transaction  |
| `/api/v1/transactions`                 | `/api/v1/transactions`                 | GET    | List transactions   |
| `/api/v1/transactions/:transactionId`  | `/api/v1/transactions/:transactionId`  | GET    | Get transaction     |
| `/api/v1/transactions/:transactionId`  | `/api/v1/transactions/:transactionId`  | PUT    | Update transaction  |
| `/api/v1/transactions/:transactionId`  | `/api/v1/transactions/:transactionId`  | DELETE | Delete transaction  |
| `/api/v1/groups/:groupId/transactions` | `/api/v1/transactions/groups/:groupId` | GET    | Group transactions  |
| `/api/v1/friends/:userId/transactions` | `/api/v1/transactions/friends/:userId` | GET    | Friend transactions |

### 3. Settlement Endpoints

| Original Endpoint              | New Endpoint                           | Method | Description                 |
| ------------------------------ | -------------------------------------- | ------ | --------------------------- |
| `/api/v1/settlements/allocate` | `/api/v1/settlements/allocate`         | POST   | Allocate settlement         |
| N/A                            | `/api/v1/settlements/allocate/expense` | POST   | Allocate expense settlement |
| N/A                            | `/api/v1/settlements/allocate/loan`    | POST   | Allocate loan settlement    |
| `/api/v1/settlements/:id`      | `/api/v1/settlements/:id`              | GET    | Get settlement by ID        |

### 4. Dashboard Endpoints

| Original Endpoint                        | New Endpoint                             | Method | Description                  |
| ---------------------------------------- | ---------------------------------------- | ------ | ---------------------------- |
| `/api/v1/dashboard/monthly-summary`      | `/api/v1/dashboard/monthly-summary`      | GET    | Get monthly summary          |
| `/api/v1/dashboard/spending-analytics`   | `/api/v1/dashboard/spending-analytics`   | GET    | Get spending analytics       |
| `/api/v1/dashboard/spending-by-category` | `/api/v1/dashboard/spending-by-category` | GET    | Get spending by category     |
| N/A                                      | `/api/v1/dashboard/loan-obligations`     | GET    | Get loan obligations summary |
| N/A                                      | `/api/v1/dashboard/expense-shares`       | GET    | Get expense shares summary   |

## Verification Approach

### 1. Contract Verification

- **Schema Validation**: Compare request/response schemas of original and new endpoints to ensure they match.
- **Required Fields**: Verify all required fields are consistent between endpoints.
- **Optional Fields**: Ensure optional fields have the same semantics in both implementations.
- **Error Responses**: Confirm error handling is consistent across implementations.

### 2. Functional Verification

- **Create Operations**: Verify that creating resources through new endpoints results in correctly stored data.
- **Read Operations**: Ensure data retrieved through new endpoints matches what would be returned by original endpoints.
- **Update Operations**: Confirm updates work correctly and maintain data integrity.
- **Delete Operations**: Verify deletion operations function as expected.

### 3. End-to-End Test Cases

For each endpoint pair (original and new), create test cases that:

1. **Setup**: Create prerequisite data if needed
2. **Execute**: Make the same request to both original and new endpoints
3. **Verify**: Compare responses for equality (accounting for expected differences like timestamps)
4. **Cleanup**: Remove any test data created during the test

### 4. Special Considerations

- **Idempotency**: Test idempotency behavior for endpoints requiring Idempotency-Key headers.
- **Pagination**: Verify pagination works consistently across both implementations.
- **Filtering**: Ensure filter parameters function the same way.
- **Authorization**: Confirm access control rules are enforced consistently.

## Test Execution Strategy

1. **Development Environment**: Run tests in a development environment with an isolated test database.
2. **Manual Testing**: Use API clients like Postman to manually verify endpoint pairs.
3. **Automated Testing**: Create automated tests using Vitest or a similar framework.
4. **Documentation**: Document all test cases and results for future reference.

## Success Criteria

The API verification will be considered successful when:

1. All new endpoint responses match their original counterparts (allowing for expected implementation differences).
2. All CRUD operations complete successfully through the new endpoints.
3. All error scenarios are handled consistently between implementations.
4. No regressions are found in existing functionality.

## Timeline

1. **Contract Verification**: 1-2 days
2. **Functional Testing**: 2-3 days
3. **End-to-End Testing**: 2-3 days
4. **Bug Fixes & Adjustments**: 1-2 days
5. **Documentation & Signoff**: 1 day

Total estimated time: 7-11 days
