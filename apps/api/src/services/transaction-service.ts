import {
  TransactionCreateWithDetails,
  TransactionUpdateWithDetails,
  TransactionAccountResponse,
} from "@pocket-pixie/contracts";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import {
  TransactionRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
  GroupRepository,
  BalanceRepository,
  GroupMemberRepository,
  ExpenseShareRepository,
} from "@/repositories";
import { FriendService } from "./friend-service";
import {
  ACCOUNT_TYPE,
  type DBType,
  type DBTransactionType,
  SHARE_TYPE,
  TXN_TYPE,
  EXPENSE_SHARE_STATUS,
  EXPENSE_SHARE_TYPE,
  asCompatibleTransaction,
} from "@/db";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "@/errors/base-error";

import { TransactionHelperService } from "./transaction-helper-service"; // helper for double-entry updates
import { InterpersonalDebtEngine } from "./interpersonal-debt-engine";

export class TransactionService {
  private readonly balanceRepository;
  private readonly groupMemberRepository;
  private readonly groupRepository;
  private readonly transactionAccountRepository;
  private readonly transactionEntryRepository;
  private readonly transactionRepository;
  private readonly transactionHelperService;
  private readonly friendService;
  private readonly expenseShareRepository;
  private readonly interpersonalDebtEngine: InterpersonalDebtEngine;
  private db: DBType;

  constructor({
    balanceRepository,
    db,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionHelperService,
    friendService,
    expenseShareRepository,
    interpersonalDebtEngine,
  }: {
    balanceRepository: BalanceRepository;
    db: DBType;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionRepository: TransactionRepository;
    transactionHelperService: TransactionHelperService;
    friendService: FriendService;
    expenseShareRepository: ExpenseShareRepository;
    interpersonalDebtEngine: InterpersonalDebtEngine;
  }) {
    this.balanceRepository = balanceRepository;
    this.db = db;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionRepository = transactionRepository;
    this.transactionHelperService = transactionHelperService;
    this.friendService = friendService;
    this.expenseShareRepository = expenseShareRepository;
    this.interpersonalDebtEngine = interpersonalDebtEngine;
  }

  async validateTransactionAccounts(
    payerId: number,
    srcAccId: number,
    dstAccId: number,
    txnType: TXN_TYPE,
    tx?: DBTransactionType
  ): Promise<{
    srcAcc: TransactionAccountResponse;
    dstAcc: TransactionAccountResponse;
  }> {
    // Ensure transaction compatibility
    const txContext = tx ? asCompatibleTransaction(tx) : undefined;

    // For loan transactions, use specialized validation
    if (txnType === TXN_TYPE.LOAN_GIVEN || txnType === TXN_TYPE.LOAN_TAKEN) {
      // For loans, we need to find accounts by ID directly since they may belong to different users
      const txnSrcAcc = await this.transactionAccountRepository.findById(
        srcAccId,
        txContext
      );
      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc = await this.transactionAccountRepository.findById(
        dstAccId,
        txContext
      );
      if (!txnDstAcc) {
        throw new TransactionAccountNotFoundError("`to` account");
      }

      return { srcAcc: txnSrcAcc, dstAcc: txnDstAcc };
    } else {
      // For non-loan transactions, both accounts must belong to the payer
      const txnSrcAcc =
        await this.transactionAccountRepository.findByUserIdAndAccountId(
          payerId,
          srcAccId,
          txContext
        );

      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc =
        await this.transactionAccountRepository.findByUserIdAndAccountId(
          payerId,
          dstAccId,
          txContext
        );

      if (!txnDstAcc) {
        throw new TransactionAccountNotFoundError("`to` account");
      }

      return { srcAcc: txnSrcAcc, dstAcc: txnDstAcc };
    }
  }

  async createTransactionHeader(
    payerId: number,
    description?: string,
    tx?: DBTransactionType
  ) {
    const finalDescription =
      typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : "";
    return await this.transactionRepository.create(
      {
        description: finalDescription,
        userId: payerId,
      },
      tx
    );
  }

  /**
   * Main transaction creation endpoint for personal expenses, income, saving and shared expenses.
   * Note: Direct loan creation has been moved to LoanService and accessed via /api/v1/loans
   */
  async createTransaction(
    transactionCreateWithDetails: TransactionCreateWithDetails,
    userCurrency: string = "INR"
  ) {
    if (
      transactionCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
      transactionCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
    ) {
      throw new ValidationError(
        "Direct loan transactions must be created via /api/v1/loans"
      );
    }
    const payerId = transactionCreateWithDetails.payer;

    await this.db.transaction(async (tx) => {
      try {
        const { srcAcc, dstAcc } = await this.validateTransactionAccounts(
          payerId,
          transactionCreateWithDetails.sourceTransactionAccountID,
          transactionCreateWithDetails.targetTransactionAccountID,
          transactionCreateWithDetails.type,
          tx
        );

        const txnHeader = await this.createTransactionHeader(
          payerId,
          transactionCreateWithDetails.description,
          tx
        );

        if (transactionCreateWithDetails.type === TXN_TYPE.EXPENSE) {
          if (transactionCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
            await this.transactionHelperService.updateAccountsAndCreateEntries(
              [
                {
                  srcAcc,
                  dstAcc,
                  amount: transactionCreateWithDetails.amount,
                  txnId: txnHeader.id,
                },
              ],
              tx
            );
          } else if (
            transactionCreateWithDetails.sharedWith === SHARE_TYPE.GROUP
          ) {
            if (!transactionCreateWithDetails.splitType) {
              throw new ValidationError("Split type must be set");
            }

            const splits = transactionCreateWithDetails.splits || [];

            const splitTotal = splits.reduce(
              (acc, split) => acc + split.amount,
              0
            );
            const payerTotal = transactionCreateWithDetails.amount - splitTotal;

            // Validate payerTotal for expense transactions
            // For expenses, payerTotal must be >= 0
            if (payerTotal < 0) {
              throw new ValidationError(
                `Split amounts (${splitTotal}) cannot exceed total transaction amount (${transactionCreateWithDetails.amount})`
              );
            }

            await this.transactionHelperService.updateAccountsAndCreateEntries(
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

            // Handle splits for shared transactions
            if (splits.length > 0) {
              for (const split of splits) {
                // Handle loan creation for this split
                // First find the appropriate accounts
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
                  throw new TransactionAccountNotFoundError(
                    `${payerId} ,  LOAN_GIVEN`
                  );
                }

                // Create the ledger entries
                await this.transactionHelperService.updateAccountsAndCreateEntries(
                  [
                    {
                      srcAcc: payerLoanGiveAcc,
                      dstAcc: payeeLoanTakenAcc,
                      amount: split.amount,
                      txnId: txnHeader.id,
                    },
                  ],
                  tx
                );

                // Update the bilateral balances
                await this.interpersonalDebtEngine.recordDirectLoan(
                  {
                    creditorId: payerId, // original payer
                    debtorId: split.userId, // participant
                    amount: split.amount,
                    currency: userCurrency,
                    groupId: transactionCreateWithDetails.groupId ?? null,
                  },
                  tx
                );
              }
            }

            // Upfront expense recognition (expense_share rows) ONLY for EXPENSE transactions
            if (transactionCreateWithDetails.type === TXN_TYPE.EXPENSE) {
              const shareRows: Array<{
                transactionId: number;
                payerUserId: number;
                participantUserId: number;
                groupId: number | null;
                type: EXPENSE_SHARE_TYPE;
                shareType: SHARE_TYPE;
                splitType: typeof transactionCreateWithDetails.splitType;
                expenseAccountId: number;
                currency: string;
                amount: number;
                paidAmount: number;
                status: EXPENSE_SHARE_STATUS;
                isPayerShare: 0 | 1;
              }> = [];
              const groupIdValue =
                transactionCreateWithDetails.sharedWith === SHARE_TYPE.GROUP
                  ? (transactionCreateWithDetails.groupId ?? null)
                  : null;

              // Payer share row (always insert for consistency)
              shareRows.push({
                transactionId: txnHeader.id,
                payerUserId: payerId,
                participantUserId: payerId,
                groupId: groupIdValue,
                type: EXPENSE_SHARE_TYPE.EXPENSE,
                shareType: transactionCreateWithDetails.sharedWith,
                splitType: transactionCreateWithDetails.splitType,
                expenseAccountId: dstAcc.id,
                currency: userCurrency,
                amount: payerTotal,
                paidAmount: payerTotal, // payer has already effectively paid their share
                // change this as payer has already effectively paid their share
                status:
                  payerTotal > 0
                    ? EXPENSE_SHARE_STATUS.PAID
                    : EXPENSE_SHARE_STATUS.UNPAID,
                isPayerShare: 1,
              });

              // Participant shares
              for (const split of splits) {
                shareRows.push({
                  transactionId: txnHeader.id,
                  payerUserId: payerId,
                  participantUserId: split.userId,
                  groupId: groupIdValue,
                  type: EXPENSE_SHARE_TYPE.EXPENSE,
                  shareType: transactionCreateWithDetails.sharedWith,
                  splitType: transactionCreateWithDetails.splitType,
                  expenseAccountId: dstAcc.id, // why this is here
                  currency: userCurrency,
                  amount: split.amount,
                  paidAmount: 0,
                  status: EXPENSE_SHARE_STATUS.UNPAID,
                  isPayerShare: 0,
                });
              }

              await this.expenseShareRepository.createMany(shareRows, tx);
            }
          } else {
            throw new NotFoundError("Provided share type not found");
          }
        } else if (
          transactionCreateWithDetails.type === TXN_TYPE.INCOME ||
          transactionCreateWithDetails.type === TXN_TYPE.SAVING
        ) {
          await this.transactionHelperService.updateAccountsAndCreateEntries(
            [
              {
                srcAcc,
                dstAcc,
                amount: transactionCreateWithDetails.amount,
                txnId: txnHeader.id,
              },
            ],
            tx
          );
        } else {
          throw new NotFoundError("Provided transaction type not found");
        }
      } catch (error: unknown) {
        tx.rollback();
        throw error;
      }
    });
  }

  async getTransactions(
    userId: number,
    filters: {
      page?: number;
      limit?: number;
      type?: string;
    } = {}
  ) {
    const { page = 1, limit = 20, type } = filters;
    const offset = (page - 1) * limit;

    // Get transactions where user is either payer or participant
    const transactions = await this.transactionRepository.findAll(
      limit,
      offset
    );

    // Filter transactions based on user involvement
    const userTransactions = transactions.filter((t) => {
      // User is the payer
      if (t.userId === userId) return true;

      // For now, we'll return all transactions - in a real implementation,
      // you'd check if user is involved in the transaction splits
      return false;
    });

    // Apply type filter if specified
    let filteredTransactions = userTransactions;
    if (type) {
      filteredTransactions = userTransactions.filter(() => {
        // This is a simplified type check - in a real implementation,
        // you'd check the transaction type from the related transaction entries
        return true; // Placeholder
      });
    }

    return {
      transactions: filteredTransactions,
      total: filteredTransactions.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async getTransactionById(transactionId: number, userId: number) {
    const transaction =
      await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    // Check if user has access to this transaction
    // User must be the payer or a participant
    if (transaction.userId !== userId) {
      // In a real implementation, check if user is in the splits
      // For now, we'll allow access if user is the creator
      throw new ForbiddenError("You don't have access to this transaction");
    }

    return transaction;
  }

  async getGroupTransactions(
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

    // Get transactions for the group
    const transactions = await this.transactionRepository.findAll(
      limit,
      offset
    );

    // Filter transactions that belong to this group
    const groupTransactions = transactions.filter(() => {
      // In a real implementation, you'd check if the transaction is associated with the group
      // For now, we'll return a placeholder
      return true;
    });

    return {
      transactions: groupTransactions,
      total: groupTransactions.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async getFriendTransactions(
    friendId: number,
    userId: number,
    filters: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Verify users are friends
    const areFriends = await this.friendService.areFriends(userId, friendId);
    if (!areFriends) {
      throw new ValidationError("You can only view transactions with friends");
    }

    // Get transactions where both users are involved
    const transactions = await this.transactionRepository.findAll(
      limit,
      offset
    );

    // Filter transactions involving both users
    const friendTransactions = transactions.filter((transaction) => {
      // User is the payer and friend is a participant, or vice versa
      if (transaction.userId === userId || transaction.userId === friendId) {
        return true;
      }
      return false;
    });

    return {
      transactions: friendTransactions,
      total: friendTransactions.length, // This should be a proper count query
      page,
      limit,
    };
  }

  async updateTransaction(
    transactionId: number,
    userId: number,
    updateData: TransactionUpdateWithDetails
  ) {
    // Verify transaction exists and user has access
    await this.getTransactionById(transactionId, userId);

    // Update the transaction
    const updatedTransaction = await this.transactionRepository.update(
      transactionId,
      updateData
    );

    if (!updatedTransaction) {
      throw new NotFoundError("Failed to update transaction");
    }

    return updatedTransaction;
  }

  async deleteTransaction(transactionId: number, userId: number) {
    // Verify transaction exists and user has access
    await this.getTransactionById(transactionId, userId);

    // Delete the transaction
    const deleted = await this.transactionRepository.delete(transactionId);

    if (!deleted) {
      throw new NotFoundError("Failed to delete transaction");
    }

    return { message: "Transaction deleted successfully" };
  }
}
