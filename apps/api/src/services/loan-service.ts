import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";

import {
  LoanRepository,
  TransactionAccountRepository,
  GroupRepository,
  LoanPayerRepository,
  LoanSplitsRepository,
  GroupMemberRepository,
  UserRepository,
} from "@/repositories";
import { FriendService } from "./friend-service";
import { TransactionService } from "./transaction-service";
import { BalanceAdjustmentService } from "./balance-adjustment-service";
import { InterpersonalDebtEngine } from "./interpersonal-debt-engine";

import {
  ACCOUNT_TYPE,
  type DBType,
  type DBTransactionType,
  SHARE_TYPE,
  TXN_TYPE,
} from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { GroupNotFoundError } from "@/errors/group-errors";
import { mathOperationAndGetFixedNumber } from "@/utils/mathUtils";
import {
  type TransactionCreateWithDetails,
  type LoanUpdate,
  type LoanResponse,
} from "@pocket-pixie/contracts";

/**
 * LoanService
 * Canonical entrypoint for direct bilateral loans (Flag F5 remediation stages 2 & 3 interim).
 * LOAN_TAKEN direction is disabled; all creations must specify type=LOAN_GIVEN. TransactionService
 * path for loan types remains blocked. Balance mutations flow through InterpersonalDebtEngine (if present)
 * falling back to BalanceAdjustmentService until the engine is fully adopted elsewhere.
 */
export class LoanService {
  private readonly loanPayerRepository;
  private readonly loanRepository: LoanRepository;
  private readonly loanSplitsRepository;
  private readonly groupMemberRepository;
  private readonly groupRepository;
  private readonly transactionAccountRepository;
  private readonly userRepository;

  private readonly transactionService: TransactionService;
  private readonly friendService: FriendService;
  private readonly balanceAdjustmentService: BalanceAdjustmentService; // fallback
  private readonly interpersonalDebtEngine?: InterpersonalDebtEngine; // new engine
  private db: DBType;
  constructor({
    db,
    loanPayerRepository,
    loanRepository,
    loanSplitsRepository,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,
    userRepository,
    transactionService,
    friendService,
    balanceAdjustmentService,
    interpersonalDebtEngine, // optional during transition
  }: {
    db: DBType;
    loanPayerRepository: LoanPayerRepository;
    loanRepository: LoanRepository;
    loanSplitsRepository: LoanSplitsRepository;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;
    userRepository: UserRepository;
    transactionService: TransactionService;
    friendService: FriendService;
    balanceAdjustmentService: BalanceAdjustmentService;
    interpersonalDebtEngine?: InterpersonalDebtEngine;
  }) {
    this.db = db;
    this.loanPayerRepository = loanPayerRepository;
    this.loanRepository = loanRepository;
    this.loanSplitsRepository = loanSplitsRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.userRepository = userRepository;

    this.transactionService = transactionService;
    this.friendService = friendService;
    this.balanceAdjustmentService = balanceAdjustmentService;
    this.interpersonalDebtEngine = interpersonalDebtEngine;
  }

  private async validateLoanTransaction(
    payerId: number,
    loanCreateWithDetails: TransactionCreateWithDetails
  ): Promise<void> {
    const {
      sourceTransactionAccountID,
      targetTransactionAccountID,
      splits,
      amount,
      type,
    } = loanCreateWithDetails;

    if (!splits || splits.length !== 1) {
      throw new ValidationError(
        "Loan transactions must have exactly one split entry"
      );
    }

    const loanSplitUser = splits[0]!;
    if (loanSplitUser.amountOwed !== amount) {
      throw new ValidationError(
        "Split amount must match the transaction amount for loan transactions"
      );
    }

    // Validate source account (must be payer's LOAN_GIVEN account)
    const loanSrcAcc =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        payerId,
        sourceTransactionAccountID
      );

    if (!loanSrcAcc) {
      throw new TransactionAccountNotFoundError("Source account not found");
    }
    if (loanSrcAcc.type !== ACCOUNT_TYPE.LOAN_GIVEN) {
      throw new ValidationError(
        "Source account must be LOAN_GIVEN for loan transactions"
      );
    }

    // Validate destination account (must be split user's LOAN_TAKEN account)
    const loanDstAcc =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        loanSplitUser.userId,
        targetTransactionAccountID
      );

    if (!loanDstAcc) {
      throw new TransactionAccountNotFoundError(
        "Destination account not found"
      );
    }
    if (loanDstAcc.type !== ACCOUNT_TYPE.LOAN_TAKEN) {
      throw new ValidationError(
        "Destination account must be LOAN_TAKEN for loan transactions"
      );
    }

    // Orientation validation (single canonical direction: LOAN_GIVEN)
    if (type !== TXN_TYPE.LOAN_GIVEN) {
      throw new ValidationError(
        "Only LOAN_GIVEN direction is supported (LOAN_TAKEN disabled)"
      );
    }
    if (loanSrcAcc.userId !== payerId) {
      throw new ValidationError(
        "Source account must belong to the payer for LOAN_GIVEN transactions"
      );
    }
    if (loanDstAcc.userId !== loanSplitUser.userId) {
      throw new ValidationError(
        "Destination account must belong to the split user for LOAN_GIVEN transactions"
      );
    }
  }

  private async createLoanAndHandleSplits(
    payerId: number,
    loanCreateWithDetails: TransactionCreateWithDetails,
    txnId: number,
    splits: { userId: number; amountOwed: number }[],
    currency: string,
    tx?: DBTransactionType
  ): Promise<LoanResponse> {
    const loan = await this.loanRepository.create(
      {
        amount: loanCreateWithDetails.amount,
        createdBy: payerId,
        currency,
        description: loanCreateWithDetails.description,
        groupId: loanCreateWithDetails.groupId,
        transactionId: txnId,
      },
      tx
    );

    await this.loanPayerRepository.create(
      {
        amountPaid: loanCreateWithDetails.amount,
        loanId: loan.id,
        userId: payerId,
      },
      tx
    );

    if (splits.length === 0) {
      throw new ValidationError("expected splits length > 0");
    }

    for (const split of splits) {
      const payeeLoanTakenAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          split.userId,
          ACCOUNT_TYPE.LOAN_TAKEN,
          tx
        );
      if (!payeeLoanTakenAcc) {
        throw new TransactionAccountNotFoundError(
          `${split.userId} , LOAN_TAKEN`
        );
      }

      const payerLoanGiveAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          payerId,
          ACCOUNT_TYPE.LOAN_GIVEN,
          tx
        );
      if (!payerLoanGiveAcc) {
        throw new TransactionAccountNotFoundError(`${payerId} ,  LOAN_GIVEN`);
      }

      await this.transactionService.updateAccountsAndCreateEntries(
        [
          {
            srcAcc: payerLoanGiveAcc,
            dstAcc: payeeLoanTakenAcc,
            amount: split.amountOwed,
            txnId: txnId,
          },
        ],
        tx
      );

      // Balance mutation via engine (canonical) or fallback.
      if (this.interpersonalDebtEngine) {
        await this.interpersonalDebtEngine.recordDirectLoan(
          {
            creditorId: payerId,
            debtorId: split.userId,
            amount: split.amountOwed,
            currency,
            groupId: loanCreateWithDetails.groupId ?? null,
          },
          tx
        );
      } else {
        await this.balanceAdjustmentService.applyBilateralDelta(
          payerId,
          split.userId,
          split.amountOwed,
          currency,
          loanCreateWithDetails.groupId ?? null,
          tx
        );
      }

      await this.loanSplitsRepository.create(
        {
          amountOwed: split.amountOwed,
          loanId: loan.id,
          userId: split.userId,
          splitType: loanCreateWithDetails.splitType,
          metadata: loanCreateWithDetails.description,
        },
        tx
      );
    }

    return loan;
  }

  private async calculateSplits(
    loanCreateWithDetails: TransactionCreateWithDetails
  ): Promise<{ userId: number; amountOwed: number }[]> {
    const payerId = loanCreateWithDetails.payer;
    if (!loanCreateWithDetails.groupId) {
      throw new ValidationError(
        "group Id not mentioned when 'share type' = 'Group'"
      );
    }

    const group = await this.groupRepository.findById(
      loanCreateWithDetails.groupId
    );
    if (!group) {
      throw new GroupNotFoundError(`${loanCreateWithDetails.groupId}`);
    }

    const groupMembers = await this.groupMemberRepository.findByGroupId(
      group.id
    );
    if (groupMembers.length === 0) {
      throw new ValidationError("group is not valid 0 members huh");
    }

    const splitPrice = mathOperationAndGetFixedNumber(
      loanCreateWithDetails.amount,
      groupMembers.length,
      (a, b) => a / b
    );

    const splits: { userId: number; amountOwed: number }[] = [];
    for (const member of groupMembers) {
      if (member.id === payerId) continue;
      splits.push({ userId: member.id, amountOwed: splitPrice });
    }
    return splits;
  }

  async createLoan(
    loanCreateWithDetails: TransactionCreateWithDetails
  ): Promise<LoanResponse> {
    const payerId = loanCreateWithDetails.payer;

    if (loanCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN) {
      // Early hard block (Stage 3 interim decision)
      throw new ValidationError(
        "LOAN_TAKEN creation is disabled – use LOAN_GIVEN canonical direction"
      );
    }

    if (loanCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN) {
      await this.validateLoanTransaction(payerId, loanCreateWithDetails);
    }

    let createdLoan: LoanResponse | null = null;
    await this.db.transaction(async (tx) => {
      try {
        const { srcAcc, dstAcc } =
          await this.transactionService.validateTransactionAccounts(
            payerId,
            loanCreateWithDetails.sourceTransactionAccountID,
            loanCreateWithDetails.targetTransactionAccountID,
            loanCreateWithDetails.type,
            tx
          );

        const txnHeader = await this.transactionService.createTransactionHeader(
          payerId,
          loanCreateWithDetails.description,
          tx
        );

        if (
          loanCreateWithDetails.type === TXN_TYPE.EXPENSE ||
          loanCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
          loanCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
        ) {
          if (loanCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
            // Direct (non-shared) case - still create ledger entries, but no loan metadata
            await this.transactionService.updateAccountsAndCreateEntries(
              [
                {
                  srcAcc,
                  dstAcc,
                  amount: loanCreateWithDetails.amount,
                  txnId: txnHeader.id,
                },
              ],
              tx
            );
            throw new ValidationError(
              "Direct loan creation requires a shared context (FRIENDS/GROUP) with a single split"
            );
          } else if (
            loanCreateWithDetails.sharedWith === SHARE_TYPE.GROUP ||
            loanCreateWithDetails.sharedWith === SHARE_TYPE.FRIENDS
          ) {
            if (!loanCreateWithDetails.splitType) {
              throw new ValidationError("Split type must be set");
            }

            const splits =
              loanCreateWithDetails.splits ??
              (await this.calculateSplits(loanCreateWithDetails));

            const splitTotal = splits.reduce(
              (acc: number, split: { amountOwed: number }) =>
                acc + split.amountOwed,
              0
            );
            const payerTotal = loanCreateWithDetails.amount - splitTotal;

            if (
              loanCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
              loanCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
            ) {
              if (payerTotal !== 0) {
                throw new ValidationError(
                  `For loan transactions, payer total must be 0, got ${payerTotal}`
                );
              }
            } else if (loanCreateWithDetails.type === TXN_TYPE.EXPENSE) {
              if (payerTotal < 0) {
                throw new ValidationError(
                  `Split amounts (${splitTotal}) cannot exceed total expense amount (${loanCreateWithDetails.amount})`
                );
              }
            }

            if (payerTotal > 0) {
              await this.transactionService.updateAccountsAndCreateEntries(
                [
                  {
                    srcAcc,
                    dstAcc,
                    amount: payerTotal,
                    txnId: txnHeader.id,
                  },
                ],
                tx
              );
            }

            const user = await this.userRepository.findById(payerId);
            const userCurrency = user?.currency || "INR";

            createdLoan = await this.createLoanAndHandleSplits(
              payerId,
              loanCreateWithDetails,
              txnHeader.id,
              splits,
              userCurrency,
              tx
            );
          } else {
            throw new NotFoundError("Provided share type not found");
          }
        } else if (
          loanCreateWithDetails.type === TXN_TYPE.INCOME ||
          loanCreateWithDetails.type === TXN_TYPE.SAVING
        ) {
          await this.transactionService.updateAccountsAndCreateEntries(
            [
              {
                srcAcc,
                dstAcc,
                amount: loanCreateWithDetails.amount,
                txnId: txnHeader.id,
              },
            ],
            tx
          );
          throw new ValidationError(
            "LoanService does not handle INCOME / SAVING transactions"
          );
        } else {
          throw new NotFoundError("Provided txn type not found");
        }
      } catch (error: any) {
        tx.rollback();
        throw error;
      }
    });

    if (!createdLoan) {
      throw new NotFoundError("Loan creation failed");
    }
    return createdLoan;
  }

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

    return {
      loans: filteredLoans,
      total: filteredLoans.length,
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

    const loans = await this.loanRepository.findAll(limit, offset);
    const groupLoans = loans.filter((loan) => loan.groupId === groupId);

    return { loans: groupLoans, total: groupLoans.length, page, limit };
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

    return { loans: friendLoans, total: friendLoans.length, page, limit };
  }

  async updateLoan(loanId: number, userId: number, updateData: LoanUpdate) {
    await this.getLoanById(loanId, userId); // access check
    const updatedLoan = await this.loanRepository.update(loanId, updateData);
    if (!updatedLoan) throw new NotFoundError("Failed to update loan");
    return updatedLoan;
  }

  async deleteLoan(loanId: number, userId: number) {
    await this.getLoanById(loanId, userId); // access check
    const deleted = await this.loanRepository.delete(loanId);
    if (!deleted) throw new NotFoundError("Failed to delete loan");
    return { message: "Loan deleted successfully" };
  }
}
