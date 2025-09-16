import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";

import {
  LoanRepository,
  TransactionAccountRepository,
  GroupRepository,
  LoanSplitsRepository,
  GroupMemberRepository,
  UserRepository,
  TransactionRepository,
} from "@/repositories";
import { FriendService } from "./friend-service";
import type { TransactionService } from "./transaction-service";
import { TransactionHelperService } from "./transaction-helper-service";
import { BalanceAdjustmentService } from "./balance-adjustment-service";
import { InterpersonalDebtEngine } from "./interpersonal-debt-engine";
import type { TransactionAccountResponse } from "@pocket-pixie/contracts";

import {
  ACCOUNT_TYPE,
  SPLIT_TYPE,
  type DBType,
  type DBTransactionType,
} from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { GroupNotFoundError } from "@/errors/group-errors";
import {
  type LoanUpdate,
  type LoanResponse,
  type LoanCreate,
  type LoanCreateSymmetric,
  type LoanCreateSymmetricInput,
  type LoanSplitResponse,
} from "@pocket-pixie/contracts";

/**
 * LoanService
 * Canonical entrypoint for direct bilateral loans.
 *
 * Legacy directional loan creation logic (createLoan / TXN_TYPE.* orientation,
 * splits orchestration, SHARE_TYPE branching, etc.) has been fully removed.
 * All clients must now use the symmetric createDirectLoanSymmetric pathway
 * which abstracts away transaction account ids, split scaffolding and
 * directional transaction semantics. Balance mutations flow through the
 * InterpersonalDebtEngine when available, falling back to
 * BalanceAdjustmentService during the transition period.
 */
export class LoanService {
  private readonly loanRepository: LoanRepository;
  private readonly loanSplitsRepository: LoanSplitsRepository;
  private readonly groupMemberRepository: GroupMemberRepository;
  private readonly groupRepository: GroupRepository;
  private readonly transactionAccountRepository: TransactionAccountRepository;
  private readonly userRepository: UserRepository; // retained for future enrichment / currency logic

  private readonly transactionService: TransactionService;
  private readonly transactionHelperService: TransactionHelperService;
  private readonly friendService: FriendService;
  private readonly balanceAdjustmentService: BalanceAdjustmentService; // fallback
  private readonly interpersonalDebtEngine?: InterpersonalDebtEngine; // new engine
  private db: DBType;
  constructor({
    db,

    loanRepository,
    loanSplitsRepository,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,
    userRepository,
    transactionService,
    transactionHelperService,
    friendService,
    balanceAdjustmentService,
    interpersonalDebtEngine, // optional during transition
  }: {
    db: DBType;

    loanRepository: LoanRepository;
    loanSplitsRepository: LoanSplitsRepository;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;
    userRepository: UserRepository;
    transactionService: TransactionService;
    transactionHelperService: TransactionHelperService;
    friendService: FriendService;
    balanceAdjustmentService: BalanceAdjustmentService;
    interpersonalDebtEngine?: InterpersonalDebtEngine;
  }) {
    this.db = db;

    this.loanRepository = loanRepository;
    this.loanSplitsRepository = loanSplitsRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.userRepository = userRepository;

    this.transactionService = transactionService;
    this.transactionHelperService = transactionHelperService;
    this.friendService = friendService;
    this.balanceAdjustmentService = balanceAdjustmentService;
    this.interpersonalDebtEngine = interpersonalDebtEngine;
  }

  // ---------------------------------------------
  // Internal Helpers & Reusable Methods
  // ---------------------------------------------

  /**
   * Creates a loan relationship between two users
   *
   * This method handles the common logic for both direct loans and
   * shared expense loan creation, including:
   * - Finding and validating loan accounts
   * - Creating double-entry ledger entries
   * - Updating bilateral balances
   *
   * @param creditorId The user providing the loan (creditor)
   * @param debtorId The user receiving the loan (debtor)
   * @param amount The loan amount (must be > 0)
   * @param transactionId The transaction header ID to associate with
   * @param currency The 3-letter currency code
   * @param groupId Optional group ID for scoping the loan
   * @param tx Optional DB transaction
   * @returns The created loan accounts for both parties
   */
  /**
   * Creates a loan relationship between two users
   *
   * This method handles the common logic for both direct loans and
   * shared expense loan creation, including:
   * - Finding and validating loan accounts
   * - Creating double-entry ledger entries
   * - Updating bilateral balances
   *
   * The method enforces these invariants:
   * - Creditor and debtor must be different users
   * - Amount must be positive
   * - Both users must have appropriate loan accounts
   *
   * If groupId is provided, the method doesn't validate group membership
   * as this should be done by the calling service.
   *
   * @param creditorId The user providing the loan (creditor)
   * @param debtorId The user receiving the loan (debtor)
   * @param amount The loan amount (must be > 0)
   * @param transactionId The transaction header ID to associate with
   * @param currency The 3-letter currency code
   * @param groupId Optional group ID for scoping the loan
   * @param tx Optional DB transaction
   * @returns The created loan accounts for both parties
   * @throws ValidationError if inputs are invalid
   * @throws TransactionAccountNotFoundError if required accounts don't exist
   */
  async createLoanRelationship(
    creditorId: number,
    debtorId: number,
    amount: number,
    transactionId: number,
    currency: string,
    groupId: number | null = null,
    tx?: DBTransactionType
  ): Promise<{
    creditorLoanGiven: TransactionAccountResponse;
    debtorLoanTaken: TransactionAccountResponse;
  }> {
    // Validate inputs
    if (creditorId === debtorId) {
      throw new ValidationError("Creditor and debtor must be different users");
    }
    if (amount <= 0) {
      throw new ValidationError("Amount must be positive");
    }
    if (currency.length !== 3) {
      throw new ValidationError("Currency must be a 3-letter ISO code");
    }

    // Fetch loan accounts
    const creditorLoanGiven =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        creditorId,
        ACCOUNT_TYPE.LOAN_GIVEN,
        tx
      );

    if (!creditorLoanGiven) {
      throw new TransactionAccountNotFoundError(
        `LOAN_GIVEN account not found for user ${creditorId}`
      );
    }

    const debtorLoanTaken =
      await this.transactionAccountRepository.findByUserIdAndCategoryName(
        debtorId,
        ACCOUNT_TYPE.LOAN_TAKEN,
        tx
      );

    if (!debtorLoanTaken) {
      throw new TransactionAccountNotFoundError(
        `LOAN_TAKEN account not found for user ${debtorId}`
      );
    }

    // Create ledger entries
    await this.transactionHelperService.updateAccountsAndCreateEntries(
      [
        {
          srcAcc: creditorLoanGiven,
          dstAcc: debtorLoanTaken,
          amount: amount,
          txnId: transactionId,
        },
      ],
      tx
    );

    // Update balances
    if (this.interpersonalDebtEngine) {
      await this.interpersonalDebtEngine.recordDirectLoan(
        {
          creditorId,
          debtorId,
          amount,
          currency,
          groupId,
        },
        tx
      );
    } else {
      await this.balanceAdjustmentService.applyBilateralDelta(
        creditorId,
        debtorId,
        amount,
        currency,
        groupId,
        tx
      );
    }

    return {
      creditorLoanGiven,
      debtorLoanTaken,
    };
  }
  private async enrichLoanWithParties(
    loan: LoanResponse,
    tx?: DBTransactionType
  ): Promise<LoanResponse> {
    // If already enriched (runtime check) return early
    if ("creditorId" in loan && "debtorId" in loan) {
      return loan;
    }
    const splits: LoanSplitResponse[] =
      await this.loanSplitsRepository.findByLoanId(loan.id, tx);
    if (splits.length !== 1) {
      throw new ValidationError(
        `Loan ${loan.id} expected exactly one split, found ${splits.length}`
      );
    }
    const debtorId = splits[0]?.userId;
    if (!debtorId) {
      throw new ValidationError(`Loan ${loan.id} split missing userId`);
    }

    return {
      ...loan,
      creditorId: loan.createdBy,
      debtorId,
    } as LoanResponse;
  }

  // ---------------------------------------------
  // Symmetric direct loan create (canonical)
  // ---------------------------------------------
  async createDirectLoanSymmetric(
    params: LoanCreateSymmetricInput,
    authenticatedUserId: number
  ): Promise<LoanResponse> {
    const { debtorId, amount, currency, groupId, description, loanDate } =
      params;

    const creditorId = authenticatedUserId; // implicit

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

    let createdLoan: LoanResponse | null = null;
    await this.db.transaction(async (tx) => {
      try {
        // Create minimal transaction header (ledger correlation) - blank description normalizes to ""
        const txnHeader = await this.transactionService.createTransactionHeader(
          creditorId,
          normalizedDescription,
          tx
        );

        // Use the shared helper method to create the loan relationship
        const { creditorLoanGiven, debtorLoanTaken } =
          await this.createLoanRelationship(
            creditorId,
            debtorId,
            amount,
            txnHeader.id,
            currency,
            groupId ?? null,
            tx
          );

        // Persist loan record
        const loanRecord = await this.loanRepository.create(
          {
            amount,
            createdBy: creditorId,
            currency,
            description: normalizedDescription,
            groupId: groupId ?? undefined,
            transactionId: txnHeader.id,
            loanDate: loanDate,
          } as LoanCreate,
          tx
        );

        await this.loanSplitsRepository.create(
          {
            amountOwed: amount,
            loanId: loanRecord.id,
            userId: debtorId,
            splitType: SPLIT_TYPE.EQUAL,
            metadata: normalizedDescription,
          },
          tx
        );

        createdLoan = {
          ...loanRecord,
          creditorId,
          debtorId,
        } as LoanResponse;
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

    const loans = await this.loanRepository.findAll(limit, offset);
    const userLoans = loans.filter((loan) => loan.createdBy === userId);

    let filteredLoans = userLoans;
    if (type) {
      filteredLoans = userLoans.filter(() => true); // placeholder filter
    }

    const enriched = await Promise.all(
      filteredLoans.map((l) => this.enrichLoanWithParties(l))
    );

    return {
      loans: enriched,
      total: enriched.length,
      page,
      limit,
    };
  }

  async getLoanById(loanId: number, userId: number) {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) throw new NotFoundError("Loan not found");

    if (loan.createdBy !== userId) {
      throw new ValidationError("You don't have access to this loan");
    }
    return await this.enrichLoanWithParties(loan);
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

    const loans = await this.loanRepository.findAll(limit, offset);
    const groupLoans = loans.filter((loan) => loan.groupId === groupId);
    const enriched = await Promise.all(
      groupLoans.map((l) => this.enrichLoanWithParties(l))
    );

    return { loans: enriched, total: enriched.length, page, limit };
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

    const loans = await this.loanRepository.findAll(limit, offset);
    const friendLoans = loans.filter(
      (loan) => loan.createdBy === userId || loan.createdBy === friendId
    );
    const enriched = await Promise.all(
      friendLoans.map((l) => this.enrichLoanWithParties(l))
    );

    return { loans: enriched, total: enriched.length, page, limit };
  }

  async updateLoan(loanId: number, userId: number, updateData: LoanUpdate) {
    await this.getLoanById(loanId, userId); // access check also enriches (not used directly)
    const updatedLoan = await this.loanRepository.update(loanId, updateData);
    if (!updatedLoan) throw new NotFoundError("Failed to update loan");
    return await this.enrichLoanWithParties(updatedLoan);
  }

  async deleteLoan(loanId: number, userId: number) {
    await this.getLoanById(loanId, userId); // access check
    const deleted = await this.loanRepository.delete(loanId);
    if (!deleted) throw new NotFoundError("Failed to delete loan");
    return { message: "Loan deleted successfully" };
  }
}
