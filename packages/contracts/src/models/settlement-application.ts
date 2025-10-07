// SettlementApplication interfaces for repository and service layers

// Interface for creating settlement applications
export interface SettlementApplicationCreate {
  settlementId: number;
  expenseShareId: number;
  appliedAmount: number;
}

// Response interface for settlement applications
export interface SettlementApplicationResponse {
  id: number;
  settlementId: number;
  expenseShareId: number;
  appliedAmount: number;
  createdAt: string;
}
