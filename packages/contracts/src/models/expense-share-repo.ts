import {
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  SHARE_TYPE,
  SPLIT_TYPE,
} from "@pocket-pixie/db-schema";

// Repository-specific interfaces that are shared with other parts of the application

// Interface for creating expense shares in the repository
export interface ExpenseShareRepoCreate {
  transactionId: number;
  payerUserId: number;
  participantUserId: number;
  groupId?: number | null;
  type?: EXPENSE_SHARE_TYPE;
  description?: string;
  shareType?: SHARE_TYPE | null;
  splitType?: SPLIT_TYPE | null;
  expenseAccountId?: number | null;
  currency: string;
  amount: number;
  paidAmount?: number;
  status?: EXPENSE_SHARE_STATUS;
  realizedAt?: Date | null;
  loanDate?: Date | null;
  isPayerShare?: number; // 1 or 0
  metadata?: Record<string, unknown>; // JSON metadata blob (opaque to domain layer)
}

// Interface for updating expense shares in the repository
export interface ExpenseShareRepoUpdate {
  paidAmount?: number;
  status?: EXPENSE_SHARE_STATUS;
  metadata?: Record<string, unknown>;
  description?: string;
  amount?: number;
  currency?: string;
}

// Response interface for expense shares from the repository
export interface ExpenseShareRepoResponse {
  id: number;
  transactionId: number;
  payerUserId: number;
  participantUserId: number;
  groupId?: number | null;
  type?: EXPENSE_SHARE_TYPE;
  description?: string;
  shareType?: SHARE_TYPE | null;
  splitType?: SPLIT_TYPE | null;
  expenseAccountId?: number | null;
  currency: string;
  amount: number;
  paidAmount: number;
  status: EXPENSE_SHARE_STATUS;
  realizedAt?: string | null;
  loanDate?: string | null;
  isPayerShare: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
