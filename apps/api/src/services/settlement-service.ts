import type {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
} from "@/models/settlement";
import { BadRequestError } from "../errors/base-error";
import { SettlementRepository } from "@/repositories/settlement-repository";
import {
  TransactionRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
} from "@/repositories";
import { ACCOUNT_TYPE } from "@/db";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { TransactionHelperService } from "./transaction-helper-service";

export class SettlementService {
  private readonly settlementRepository;
  private readonly transactionRepository;
  private readonly transactionEntryRepository;
  private readonly transactionAccountRepository;
  private readonly transactionHelperService;

  constructor({
    settlementRepository,
    transactionRepository,
    transactionEntryRepository,
    transactionAccountRepository,
    transactionHelperService,
  }: {
    settlementRepository: SettlementRepository;
    transactionRepository: TransactionRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionHelperService: TransactionHelperService;
  }) {
    this.settlementRepository = settlementRepository;
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionHelperService = transactionHelperService;
  }

  async getAllSettlements(
    limit: number = 10,
    offset: number = 0
  ): Promise<SettlementResponse[]> {
    return this.settlementRepository.findAll(limit, offset);
  }

  async getSettlementById(id: string): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    return this.settlementRepository.findById(numericId);
  }

  async getSettlementsByGroupId(
    groupId: number
  ): Promise<SettlementResponse[]> {
    if (!groupId || typeof groupId !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    return this.settlementRepository.findByGroupId(groupId);
  }

  async createSettlement(data: SettlementCreate): Promise<SettlementResponse> {
    // Validate that payer and payee are different
    if (data.payerId === data.payeeId) {
      throw new BadRequestError("Payer and payee cannot be the same user");
    }

    // Validate amount is positive
    if (data.amount <= 0) {
      throw new BadRequestError("Settlement amount must be positive");
    }

    return this.settlementRepository.create(data);
  }

  async updateSettlement(
    id: string,
    data: SettlementUpdate
  ): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      return null;
    }

    return this.settlementRepository.update(numericId, data);
  }

  async deleteSettlement(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      throw new BadRequestError("Settlement not found");
    }

    return this.settlementRepository.delete(numericId);
  }

  async settleExpenseDebt(
    settlerId: number, // u2 (the one settling)
    payerId: number, // u1 (the original payer)
    amount: number,
    groupId: number,
    originalTransactionId: number // txhdr1 from original expense
  ): Promise<SettlementResponse> {
    // Validate inputs
    if (settlerId === payerId) {
      throw new BadRequestError("Settler and payer cannot be the same user");
    }

    if (amount <= 0) {
      throw new BadRequestError("Settlement amount must be positive");
    }

    // Step 1: Debt Settlement - Transfer the loan from settler to payer
    // u2 loan_taken -100, u1 loan_given +100
    const settlerLoanTakenAcc =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        settlerId,
        ACCOUNT_TYPE.LOAN_TAKEN
      );

    if (!settlerLoanTakenAcc) {
      throw new TransactionAccountNotFoundError(
        `${settlerId} LOAN_TAKEN account`
      );
    }

    const payerLoanGivenAcc =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        payerId,
        ACCOUNT_TYPE.LOAN_GIVEN
      );

    if (!payerLoanGivenAcc) {
      throw new TransactionAccountNotFoundError(
        `${payerId} LOAN_GIVEN account`
      );
    }

    // Create transaction header for debt settlement
    const debtSettlementTxn = await this.transactionRepository.create({
      description: `Debt settlement between users`,
      userId: settlerId,
    });

    // Update account balances and create entries for debt settlement
    await this.transactionHelperService.updateAccountsAndCreateEntries([
      {
        srcAcc: settlerLoanTakenAcc,
        dstAcc: payerLoanGivenAcc,
        amount: amount,
        txnId: debtSettlementTxn.id,
      },
    ]);

    // Step 2: Payment Recording - Record that settler actually paid the money
    // u2 outgoing -100, expense +100 (using original transaction header)
    const settlerOutgoingAcc =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        settlerId,
        ACCOUNT_TYPE.OUTGOING
      );

    if (!settlerOutgoingAcc) {
      throw new TransactionAccountNotFoundError(
        `${settlerId} OUTGOING account`
      );
    }

    const settlerExpenseAcc =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        settlerId,
        ACCOUNT_TYPE.EXPENSE
      );

    if (!settlerExpenseAcc) {
      throw new TransactionAccountNotFoundError(`${settlerId} EXPENSE account`);
    }

    // Update account balances and create entries for payment recording
    await this.transactionHelperService.updateAccountsAndCreateEntries([
      {
        srcAcc: settlerOutgoingAcc,
        dstAcc: settlerExpenseAcc,
        amount: amount,
        txnId: originalTransactionId, // Use original transaction header
      },
    ]);

    // Create settlement record
    const settlement = await this.settlementRepository.create({
      payerId: payerId,
      payeeId: settlerId,
      amount: amount,
      groupId: groupId,
      currency: "INR", // Default currency
    });

    return settlement;
  }
}
