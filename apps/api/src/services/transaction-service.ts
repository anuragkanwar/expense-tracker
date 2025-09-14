import { TransactionCreateWithDetails } from "@/dto/transactions.dto";
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
} from "@/db";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "@/errors/base-error";
import { TransactionUpdateWithDetails } from "@/dto/transactions.dto";
import { TransactionAccountResponse } from "@/models";
import { TransactionHelperService } from "./transaction-helper-service"; // helper for double-entry updates
import { BalanceAdjustmentService } from "./balance-adjustment-service";

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
  private readonly balanceAdjustmentService: BalanceAdjustmentService;
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
    balanceAdjustmentService,
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
    balanceAdjustmentService: BalanceAdjustmentService;
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
    this.balanceAdjustmentService = balanceAdjustmentService;
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
    // For loan transactions, use specialized validation
    if (txnType === TXN_TYPE.LOAN_GIVEN || txnType === TXN_TYPE.LOAN_TAKEN) {
      // For loans, we need to find accounts by ID directly since they may belong to different users
      const txnSrcAcc = await this.transactionAccountRepository.findById(
        srcAccId,
        tx
      );
      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc = await this.transactionAccountRepository.findById(
        dstAccId,
        tx
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
          tx
        );

      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc =
        await this.transactionAccountRepository.findByUserIdAndAccountId(
          payerId,
          dstAccId,
          tx
        );

      if (!txnDstAcc) {
        throw new TransactionAccountNotFoundError("`to` account");
      }

      return { srcAcc: txnSrcAcc, dstAcc: txnDstAcc };
    }
  }

  async createTransactionHeader(
    payerId: number,
    description: string,
    tx?: DBTransactionType
  ) {
    return await this.transactionRepository.create(
      {
        description,
        userId: payerId,
      },
      tx
    );
  }

  async updateAccountsAndCreateEntries(
    entries: Array<{
      srcAcc: TransactionAccountResponse;
      dstAcc: TransactionAccountResponse;
      amount: number;
      txnId: number;
    }>,
    tx?: DBTransactionType
  ): Promise<void> {
    for (const entry of entries) {
      if (entry.amount <= 0) {
        continue;
      }

      // Update source account balance (money going out)
      await this.transactionAccountRepository.update(
        entry.srcAcc.id,
        {
          balance: entry.srcAcc.balance - entry.amount,
        },
        tx
      );

      // Update destination account balance (money coming in)
      await this.transactionAccountRepository.update(
        entry.dstAcc.id,
        {
          balance: entry.dstAcc.balance + entry.amount,
        },
        tx
      );

      // Create transaction entries (double-entry)
      await this.transactionEntryRepository.create(
        {
          amount: entry.amount,
          transactionAccountId: entry.dstAcc.id,
          transactionId: entry.txnId,
        },
        tx
      );

      await this.transactionEntryRepository.create(
        {
          amount: -entry.amount,
          transactionAccountId: entry.srcAcc.id,
          transactionId: entry.txnId,
        },
        tx
      );
    }
  }

  /** Legacy updateBalances logic removed - use balanceAdjustmentService */
  async createTransaction(
    transactionCreateWithDetails: TransactionCreateWithDetails,
    userCurrency: string = "INR"
  ) {
    // Flag F5 (Dual Loan Pathways Divergence): Block direct loan creation here.
    // Canonical path for LOAN_GIVEN / LOAN_TAKEN is now LoanService via /api/v1/loans.
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

        if (
          transactionCreateWithDetails.type === TXN_TYPE.EXPENSE ||
          transactionCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
          transactionCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
        ) {
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
            transactionCreateWithDetails.sharedWith === SHARE_TYPE.GROUP ||
            transactionCreateWithDetails.sharedWith === SHARE_TYPE.FRIENDS
          ) {
            if (!transactionCreateWithDetails.splitType) {
              throw new ValidationError("Split type must be set");
            }

            const splits = transactionCreateWithDetails.splits || [];

            const splitTotal = splits.reduce(
              (acc, split) => acc + split.amountOwed,
              0
            );
            const payerTotal = transactionCreateWithDetails.amount - splitTotal;

            // Validate payerTotal based on transaction type
            if (
              transactionCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
              transactionCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
            ) {
              // For loans, payerTotal must be exactly 0
              if (payerTotal !== 0) {
                throw new ValidationError(
                  `For loan transactions, payer total must be 0, got ${payerTotal}`
                );
              }
            } else if (transactionCreateWithDetails.type === TXN_TYPE.EXPENSE) {
              // For expenses, payerTotal must be >= 0
              if (payerTotal < 0) {
                throw new ValidationError(
                  `Split amounts (${splitTotal}) cannot exceed total transaction amount (${transactionCreateWithDetails.amount})`
                );
              }
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

                await this.transactionHelperService.updateAccountsAndCreateEntries(
                  [
                    {
                      srcAcc: payerLoanGiveAcc,
                      dstAcc: payeeLoanTakenAcc,
                      amount: split.amountOwed,
                      txnId: txnHeader.id,
                    },
                  ],
                  tx
                );

                // Adjust balances using canonical service: payer (creditor) vs participant (debtor)
                await this.balanceAdjustmentService.applyBilateralDelta(
                  payerId, // creditor: original payer
                  split.userId, // debtor: participant
                  split.amountOwed,
                  userCurrency,
                  transactionCreateWithDetails.groupId ?? null,
                  tx
                );
              }
            }

            // Upfront expense recognition (expense_share rows) ONLY for EXPENSE transactions
            if (transactionCreateWithDetails.type === TXN_TYPE.EXPENSE) {
              const shareRows: any[] = [];
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
                shareType: transactionCreateWithDetails.sharedWith,
                splitType: transactionCreateWithDetails.splitType,
                expenseAccountId: dstAcc.id,
                currency: userCurrency,
                amount: payerTotal,
                paidAmount: payerTotal, // payer has already effectively paid their share
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
                  shareType: transactionCreateWithDetails.sharedWith,
                  splitType: transactionCreateWithDetails.splitType,
                  expenseAccountId: dstAcc.id,
                  currency: userCurrency,
                  amount: split.amountOwed,
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
      } catch (error: any) {
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
    const userTransactions = transactions.filter((transaction) => {
      // User is the payer
      if (transaction.userId === userId) return true;

      // For now, we'll return all transactions - in a real implementation,
      // you'd check if user is involved in the transaction splits
      return false;
    });

    // Apply type filter if specified
    let filteredTransactions = userTransactions;
    if (type) {
      filteredTransactions = userTransactions.filter((transaction) => {
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
    const groupTransactions = transactions.filter((transaction) => {
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
    const existingTransaction = await this.getTransactionById(
      transactionId,
      userId
    );

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
