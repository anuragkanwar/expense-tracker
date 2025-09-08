import { TransactionCreateWithDetails } from "@/dto/transactions.dto";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";

import {
  LoanRepository,
  TransactionAccountRepository,
  GroupRepository,
  LoanPayerRepository,
  LoanSplitsRepository,
  GroupMemberRepository,
} from "@/repositories";
import { FriendService } from "./friend-service";
import { TransactionService } from "./transaction-service";

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
import { TransactionAccountResponse } from "@/models";
import { TransactionHelperService } from "./transaction-helper-service";

export class LoanService {
  private readonly loanPayerRepository;
  private readonly loanRepository;
  private readonly loanSplitsRepository;
  private readonly groupMemberRepository;
  private readonly groupRepository;
  private readonly transactionAccountRepository;

  private readonly transactionService;
  private readonly friendService;
  private db: DBType;
  constructor({
    db,
    loanPayerRepository,
    loanRepository,
    loanSplitsRepository,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,

    transactionService,
    friendService,
  }: {
    db: DBType;
    loanPayerRepository: LoanPayerRepository;
    loanRepository: LoanRepository;
    loanSplitsRepository: LoanSplitsRepository;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;

    transactionService: TransactionService;
    friendService: FriendService;
  }) {
    this.db = db;
    this.loanPayerRepository = loanPayerRepository;
    this.loanRepository = loanRepository;
    this.loanSplitsRepository = loanSplitsRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;

    this.transactionService = transactionService;
    this.friendService = friendService;
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

    // Validate splits for loan transactions
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

    // Additional validation for transaction type
    if (type === TXN_TYPE.LOAN_GIVEN) {
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
    } else if (type === TXN_TYPE.LOAN_TAKEN) {
      if (loanSrcAcc.userId !== loanSplitUser.userId) {
        throw new ValidationError(
          "Source account must belong to the split user for LOAN_TAKEN transactions"
        );
      }
      if (loanDstAcc.userId !== payerId) {
        throw new ValidationError(
          "Destination account must belong to the payer for LOAN_TAKEN transactions"
        );
      }
    }
  }

  private async createLoanAndHandleSplits(
    payerId: number,
    loanCreateWithDetails: TransactionCreateWithDetails,
    txnId: number,
    splits: {
      userId: number;
      amountOwed: number;
    }[],
    tx?: DBTransactionType
  ) {
    const loan = await this.loanRepository.create(
      {
        amount: loanCreateWithDetails.amount,
        createdBy: payerId,
        currency: "INR",
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

      await this.transactionService.updateBalances(
        payerId,
        split.userId,
        split.amountOwed,
        loanCreateWithDetails.groupId,
        tx
      );

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
  }

  private async calculateSplits(
    loanCreateWithDetails: TransactionCreateWithDetails
  ): Promise<
    {
      userId: number;
      amountOwed: number;
    }[]
  > {
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
    const splits: {
      userId: number;
      amountOwed: number;
    }[] = [];
    for (const member of groupMembers) {
      if (member.id === payerId) {
        continue;
      }
      splits.push({
        userId: member.id,
        amountOwed: splitPrice,
      });
    }
    return splits;
  }

  // NOTE:
  // EXPENSE => OUTGOING -> EXPENSE (categories)
  // INCOME => EXTERNAL (-) -> INCOME (+)
  // LOAN_TAKEN => LOAN_GIVEN (someones) -> LOAN_TAKEN
  // LOAN_GIVEN => LOAN_TAKEN (someones) -> LOAN_GIVEN
  async createLoan(loanCreateWithDetails: TransactionCreateWithDetails) {
    const payerId = loanCreateWithDetails.payer;

    // Validate loan transactions specifically
    if (
      loanCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
      loanCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
    ) {
      await this.validateLoanTransaction(payerId, loanCreateWithDetails);
    }

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

            // Validate payerTotal based on transaction type
            if (
              loanCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
              loanCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
            ) {
              // For loans, payerTotal must be exactly 0
              if (payerTotal !== 0) {
                throw new ValidationError(
                  `For loan transactions, payer total must be 0, got ${payerTotal}`
                );
              }
            } else if (loanCreateWithDetails.type === TXN_TYPE.EXPENSE) {
              // For expenses, payerTotal must be >= 0
              if (payerTotal < 0) {
                throw new ValidationError(
                  `Split amounts (${splitTotal}) cannot exceed total expense amount (${loanCreateWithDetails.amount})`
                );
              }
            }

            await this.transactionService.updateAccountsAndCreateEntries(
              [
                {
                  srcAcc: srcAcc,
                  dstAcc: dstAcc,
                  amount: payerTotal,
                  txnId: txnHeader.id,
                },
              ],
              tx
            );

            await this.createLoanAndHandleSplits(
              payerId,
              loanCreateWithDetails,
              txnHeader.id,
              splits,
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
        } else {
          throw new NotFoundError("Provided txn type not found");
        }
      } catch (error: any) {
        tx.rollback();
        throw error;
      }
    });
  }

  async getLoans(
    userId: number,
    filters: {
      page?: number;
      limit?: number;
      type?: string;
    } = {}
  ) {
    const { page = 1, limit = 20, type } = filters;
    const offset = (page - 1) * limit;

    // Get loans where user is either payer or participant
    const loans = await this.loanRepository.findAll(limit, offset);

    // Filter loans based on user involvement
    const userLoans = loans.filter((loan) => {
      // User is the payer
      if (loan.createdBy === userId) return true;

      // User is a participant (check splits)
      // This is a simplified check - in a real implementation,
      // you'd join with loan_splits table
      return false;
    });

    // Apply type filter if specified
    let filteredLoans = userLoans;
    if (type) {
      filteredLoans = userLoans.filter((_loan) => {
        // This is a simplified type check - in a real implementation,
        // you'd check the transaction type from the related transaction
        return true; // Placeholder
      });
    }

    return {
      loans: filteredLoans,
      total: filteredLoans.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async getLoanById(loanId: number, userId: number) {
    const loan = await this.loanRepository.findById(loanId);

    if (!loan) {
      throw new NotFoundError("Loan not found");
    }

    // Check if user has access to this loan
    // User must be the payer or a participant
    if (loan.createdBy !== userId) {
      // In a real implementation, check if user is in the splits
      // For now, we'll allow access if user is the creator
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

    // Verify user has access to the group
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is a member of the group
    const isMember = await this.groupMemberRepository.findByGroupIdAndUserId(
      groupId,
      userId
    );
    if (!isMember) {
      throw new ValidationError("You don't have access to this group");
    }

    // Get loans for the group
    const loans = await this.loanRepository.findAll(limit, offset);

    // Filter loans that belong to this group
    const groupLoans = loans.filter((loan) => loan.groupId === groupId);

    return {
      loans: groupLoans,
      total: groupLoans.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async getFriendLoans(
    friendId: number,
    userId: number,
    filters: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Verify users are friends
    const areFriends = await this.friendService.areFriends(userId, friendId);
    if (!areFriends) {
      throw new ValidationError("You can only view expenses with friends");
    }

    // Get loans where both users are involved
    const loans = await this.loanRepository.findAll(limit, offset);

    // Filter loans involving both users
    const friendLoans = loans.filter((loan) => {
      // User is the payer and friend is a participant, or vice versa
      if (loan.createdBy === userId || loan.createdBy === friendId) {
        return true;
      }
      return false;
    });

    return {
      loans: friendLoans,
      total: friendLoans.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async updateLoan(loanId: number, userId: number, updateData: any) {
    // Verify expense exists and user has access
    await this.getLoanById(loanId, userId);

    // Update the loan
    const updatedLoan = await this.loanRepository.update(loanId, updateData);

    if (!updatedLoan) {
      throw new NotFoundError("Failed to update loan");
    }

    return updatedLoan;
  }

  async deleteLoan(loanId: number, userId: number) {
    // Verify loan exists and user has access
    await this.getLoanById(loanId, userId);

    // Delete the loan
    const deleted = await this.loanRepository.delete(loanId);

    if (!deleted) {
      throw new NotFoundError("Failed to delete loan");
    }

    return { message: "Loan deleted successfully" };
  }
}
