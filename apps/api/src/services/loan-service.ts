import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";

import {
  ExpenseShareRepository,
  TransactionAccountRepository,
  GroupRepository,
  GroupMemberRepository,
  UserRepository,
} from "@/repositories";
import { FriendService } from "./friend-service";
import type { TransactionService } from "./transaction-service";
import { TransactionHelperService } from "./transaction-helper-service";

import { InterpersonalDebtEngine } from "./interpersonal-debt-engine";
import type { TransactionAccountResponse } from "@pocket-pixie/contracts";

import { ACCOUNT_TYPE, type DBType, type DBTransactionType } from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { GroupNotFoundError } from "@/errors/group-errors";
import {
  type LoanUpdate,
  type LoanResponse,
  type LoanCreateInput,
} from "@pocket-pixie/contracts";

/**
 * LoanService
 * This service manages loan operations using the ExpenseShareRepository
 * for the unified schema implementation.
 */
export class LoanService {
  private readonly expenseShareRepository: ExpenseShareRepository;
  private readonly groupMemberRepository: GroupMemberRepository;
  private readonly groupRepository: GroupRepository;
  private readonly transactionAccountRepository: TransactionAccountRepository;
  private readonly userRepository: UserRepository; // retained for future enrichment / currency logic

  private readonly transactionService: TransactionService;
  private readonly transactionHelperService: TransactionHelperService;
  private readonly friendService: FriendService;
  private readonly interpersonalDebtEngine: InterpersonalDebtEngine; // new engine
  private db: DBType;

  constructor({
    db,
    expenseShareRepository,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,
    userRepository,
    transactionService,
    transactionHelperService,
    friendService,
    interpersonalDebtEngine,
  }: {
    db: DBType;
    expenseShareRepository: ExpenseShareRepository;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;
    userRepository: UserRepository;
    transactionService: TransactionService;
    transactionHelperService: TransactionHelperService;
    friendService: FriendService;
    interpersonalDebtEngine: InterpersonalDebtEngine;
  }) {
    this.db = db;

    this.expenseShareRepository = expenseShareRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.userRepository = userRepository;

    this.transactionService = transactionService;
    this.transactionHelperService = transactionHelperService;
    this.friendService = friendService;
    this.interpersonalDebtEngine = interpersonalDebtEngine;
  }

  async createLoanDirect(
    params: LoanCreateInput,
    authenticatedUserId: number
  ): Promise<LoanResponse> {
    const {
      creditorId,
      debtorId,
      amount,
      currency,
      groupId,
      description,
      loanDate,
    } = params;

    // Both creditorId and debtorId are required and explicitly provided
    // Validate user roles
    if (
      authenticatedUserId !== creditorId &&
      authenticatedUserId !== debtorId
    ) {
      throw new ValidationError(
        "Authenticated user must be either creditor or debtor"
      );
    }

    if (creditorId === debtorId) {
      throw new ValidationError("Creditor and debtor must be different users");
    }
    if (amount <= 0) {
      throw new ValidationError("Amount must be > 0");
    }
    if (!currency || currency.length !== 3) {
      throw new ValidationError("Currency must be a 3-letter ISO code");
    }

    // Context validation: group membership OR friendship
    if (groupId) {
      const group = await this.groupRepository.findById(groupId);
      if (!group) throw new GroupNotFoundError(`${groupId}`);
      const creditorMember =
        await this.groupMemberRepository.findByGroupIdAndUserId(
          groupId,
          creditorId
        );
      const debtorMember =
        await this.groupMemberRepository.findByGroupIdAndUserId(
          groupId,
          debtorId
        );
      if (!creditorMember || !debtorMember) {
        throw new ValidationError(
          "Both creditor and debtor must be members of the specified group"
        );
      }
    } else {
      const areFriends = await this.friendService.areFriends(
        creditorId,
        debtorId
      );
      if (!areFriends) {
        throw new ValidationError(
          "Users must be friends to create a direct loan outside a group"
        );
      }
    }

    const normalizedDescription = (description ?? "").trim();
    const parsedLoanDate = loanDate ? new Date(loanDate) : new Date();

    let createdLoan: LoanResponse | null = null;
    await this.db.transaction(async (tx) => {
      try {
        // Create minimal transaction header (ledger correlation) - blank description normalizes to ""
        const txnHeader = await this.transactionService.createTransactionHeader(
          creditorId,
          normalizedDescription,
          tx
        );

        // record direct loan with IDE
        await this.interpersonalDebtEngine.recordDirectLoan(
          {
            creditorId,
            debtorId,
            amount,
            currency,
            transactionId: txnHeader.id,
            groupId
          },
          tx
        );

        // Persist loan record in unified expense share table
        createdLoan = await this.expenseShareRepository.createLoan(
          {
            transactionId: txnHeader.id,
            creditorId,
            debtorId,
            amount,
            currency,
            description: normalizedDescription,
            groupId: groupId ?? null,
            loanDate: parsedLoanDate,
          },
          tx
        );
      } catch (error) {
        tx.rollback();
        throw error;
      }
    });

    if (!createdLoan) {
      throw new NotFoundError("Loan creation failed");
    }
    return createdLoan;
  }

  // ---------------------------------------------
  // Queries / Mutations (enriched responses)
  // ---------------------------------------------
  async getLoans(
    userId: number,
    filters: { page?: number; limit?: number; type?: string } = {}
  ) {
    const { page = 1, limit = 20, type } = filters;
    const offset = (page - 1) * limit;

    // Use repository filter options
    const loanFilters = {
      userId,
      limit,
      offset,
      isPersonal: true, // Default to personal loans
      asCreditor: true,
      asDebtor: true,
    };

    // Apply role filters based on type if specified
    if (type === "given") {
      loanFilters.asCreditor = true;
      loanFilters.asDebtor = false;
    } else if (type === "taken") {
      loanFilters.asCreditor = false;
      loanFilters.asDebtor = true;
    }

    // Use the unified repository
    const loans = await this.expenseShareRepository.findLoans(loanFilters);

    // Count total for pagination
    const total = await this.expenseShareRepository.countLoans({
      userId,
      isPersonal: true,
      asCreditor: loanFilters.asCreditor,
      asDebtor: loanFilters.asDebtor,
    });

    return {
      loans,
      total,
      page,
      limit,
    };
  }

  async getLoanById(loanId: number, userId: number) {
    const loan = await this.expenseShareRepository.findLoanById(loanId);
    if (!loan) throw new NotFoundError("Loan not found");

    // Check access: user is either creditor or debtor
    const isCreditor = loan.createdBy === userId;
    const isDebtor = loan.debtorId === userId;

    if (!isCreditor && !isDebtor) {
      throw new ValidationError("You don't have access to this loan");
    }

    return loan;
  }

  async getGroupLoans(
    groupId: number,
    userId: number,
    filters: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const group = await this.groupRepository.findById(groupId);
    if (!group) throw new NotFoundError("Group not found");

    const isMember = await this.groupMemberRepository.findByGroupIdAndUserId(
      groupId,
      userId
    );
    if (!isMember)
      throw new ValidationError("You don't have access to this group");

    // Use unified repository method for group loans
    const loanFilters = {
      groupId,
      userId,
      limit,
      offset,
    };

    const loans = await this.expenseShareRepository.findLoans(loanFilters);

    // Get count for pagination
    const total = await this.expenseShareRepository.countLoans({
      groupId,
      userId,
    });

    return { loans, total, page, limit };
  }

  async getFriendLoans(
    friendId: number,
    userId: number,
    filters: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const areFriends = await this.friendService.areFriends(userId, friendId);
    if (!areFriends) {
      throw new ValidationError("You can only view expenses with friends");
    }

    // Use the specialized friend-to-friend loans query
    const loanFilters = {
      userId,
      friendId,
      limit,
      offset,
      isPersonal: true, // Only personal loans between friends
    };

    const loans = await this.expenseShareRepository.findLoans(loanFilters);

    // Get count for pagination
    const total = await this.expenseShareRepository.countLoans({
      userId,
      friendId,
      isPersonal: true,
    });

    return { loans, total, page, limit };
  }

  async updateLoan(loanId: number, userId: number, updateData: LoanUpdate) {
    await this.getLoanById(loanId, userId); // access check

    const updatedLoan = await this.expenseShareRepository.updateLoan(loanId, {
      description: updateData.description,
      amount: updateData.amount,
      currency: updateData.currency,
    });

    if (!updatedLoan) throw new NotFoundError("Failed to update loan");
    return updatedLoan;
  }

  async deleteLoan(loanId: number, userId: number) {
    await this.getLoanById(loanId, userId); // access check
    const deleted = await this.expenseShareRepository.delete(loanId);
    if (!deleted) throw new NotFoundError("Failed to delete loan");
    return { message: "Loan deleted successfully" };
  }
}
