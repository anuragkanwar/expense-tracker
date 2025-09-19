/**
 * Mock Types for Test Files
 *
 * This file contains type definitions for commonly mocked objects in test files.
 * Using these types instead of 'any' provides better type safety and auto-completion.
 */
import { type DBTransactionType } from "@/db";
import { vi } from "vitest";

// Use a simple any-based mock type to avoid generic typing issues
// This avoids the "Type 'Mock' is not generic" errors
type Mock = any;

/**
 * Common mock type for database transaction context
 * This type must be compatible with DBTransactionType for testing
 */
export type MockTransactionContext = {
  rollback: Mock;
  // Add all methods used from DBTransactionType in the codebase
  select: Mock;
  insert: Mock;
  update: Mock;
  delete: Mock;
  from: Mock;
  where: Mock;
  set: Mock;
  values: Mock;
  returning: Mock;
  limit: Mock;
  offset: Mock;
  orderBy: Mock;
};

/**
 * Mock database with transaction method
 */
export interface MockDatabase {
  transaction: (
    fn: (tx: MockTransactionContext) => Promise<unknown>
  ) => Promise<unknown>;
}

/**
 * Base repository mock with common CRUD operations
 */
export interface BaseMockRepository<
  T,
  CreateType,
  UpdateType = Partial<CreateType>,
> {
  create: (data: CreateType, tx?: DBTransactionType) => Promise<T>;
  findAll: (
    limit?: number,
    offset?: number,
    tx?: DBTransactionType
  ) => Promise<T[]>;
  findById: (id: number, tx?: DBTransactionType) => Promise<T | null>;
  update: (
    id: number,
    data: UpdateType,
    tx?: DBTransactionType
  ) => Promise<T | null>;
  delete: (id: number, tx?: DBTransactionType) => Promise<boolean>;
}

/**
 * Generic repository factory to create typed mock repositories
 */
export function createMockRepository<
  T,
  CreateType,
  UpdateType = Partial<CreateType>,
>(): BaseMockRepository<T, CreateType, UpdateType> {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Mock transaction repository
 */
export interface MockTransactionRepository
  extends BaseMockRepository<any, any> {
  findByUserId: (userId: number, tx?: DBTransactionType) => Promise<any[]>;
}

/**
 * Mock transaction account repository
 */
export interface MockTransactionAccountRepository {
  findByUserIdAndAccountId: (
    userId: number,
    accountId: number,
    tx?: DBTransactionType
  ) => Promise<any | null>;
  findByUserIdAndCategoryName: (
    userId: number,
    categoryName: string,
    tx?: DBTransactionType
  ) => Promise<any | null>;
  update: (
    id: number,
    data: any,
    tx?: DBTransactionType
  ) => Promise<any | null>;
}

/**
 * Mock expense share repository
 */
export interface MockExpenseShareRepository {
  createMany: (data: any[], tx?: DBTransactionType) => Promise<any[]>;
  findById: (id: number, tx?: DBTransactionType) => Promise<any | null>;
  findAllocatableShares: (
    debtorId: number,
    creditorId: number,
    currency: string,
    groupId?: number | null,
    type?: string | null,
    tx?: DBTransactionType
  ) => Promise<any[]>;
  updateSharePayment: (
    id: number,
    paidAmount: number,
    status: string,
    tx?: DBTransactionType
  ) => Promise<any | null>;
}

/**
 * Mock friend service
 */
export interface MockFriendService {
  areFriends: (userId1: number, userId2: number) => Promise<boolean>;
}

/**
 * Mock interpersonal debt engine
 */
export interface MockInterpersonalDebtEngine {
  recordDirectLoan: (
    params: {
      creditorId: number;
      debtorId: number;
      amount: number;
      currency: string;
      groupId?: number | null;
    },
    tx?: DBTransactionType
  ) => Promise<void>;
  recordRepayment: (
    params: {
      debtorId: number;
      creditorId: number;
      amount: number;
      currency: string;
      groupId?: number | null;
    },
    tx?: DBTransactionType
  ) => Promise<void>;
}

/**
 * Mock transaction helper service
 */
export interface MockTransactionHelperService {
  updateAccountsAndCreateEntries: (
    data: any,
    tx?: DBTransactionType
  ) => Promise<any>;
}

/**
 * Mock settlement repository
 */
export interface MockSettlementRepository {
  create: (data: any, tx?: DBTransactionType) => Promise<any>;
  findById: (id: number, tx?: DBTransactionType) => Promise<any | null>;
}

/**
 * Mock settlement application repository
 */
export interface MockSettlementApplicationRepository {
  create: (data: any, tx?: DBTransactionType) => Promise<any>;
}

/**
 * Mock balance adjustment service
 */
export interface MockBalanceAdjustmentService {
  adjustAccountBalance: (
    accountId: number,
    amount: number,
    tx?: DBTransactionType
  ) => Promise<any>;
}

/**
 * Helper function to create a mock database
 */
export function createMockDatabase(): MockDatabase {
  return {
    transaction: vi.fn(async (fn) => {
      const tx = {
        rollback: vi.fn(),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
      };
      return await fn(tx);
    }),
  };
}

/**
 * Helper function to create a typed mock transaction repository
 */
export function createMockTransactionRepository(): MockTransactionRepository {
  return {
    ...createMockRepository<any, any>(),
    findByUserId: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock transaction account repository
 */
export function createMockTransactionAccountRepository(): MockTransactionAccountRepository {
  return {
    findByUserIdAndAccountId: vi.fn(),
    findByUserIdAndCategoryName: vi.fn(),
    update: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock expense share repository
 */
export function createMockExpenseShareRepository(): MockExpenseShareRepository {
  return {
    createMany: vi.fn(),
    findById: vi.fn(),
    findAllocatableShares: vi.fn(),
    updateSharePayment: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock friend service
 */
export function createMockFriendService(): MockFriendService {
  return {
    areFriends: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock interpersonal debt engine
 */
export function createMockInterpersonalDebtEngine(): MockInterpersonalDebtEngine {
  return {
    recordDirectLoan: vi.fn(),
    recordRepayment: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock transaction helper service
 */
export function createMockTransactionHelperService(): MockTransactionHelperService {
  return {
    updateAccountsAndCreateEntries: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock settlement repository
 */
export function createMockSettlementRepository(): MockSettlementRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock settlement application repository
 */
export function createMockSettlementApplicationRepository(): MockSettlementApplicationRepository {
  return {
    create: vi.fn(),
  };
}

/**
 * Helper function to create a typed mock balance adjustment service
 */
export function createMockBalanceAdjustmentService(): MockBalanceAdjustmentService {
  return {
    adjustAccountBalance: vi.fn(),
  };
}
