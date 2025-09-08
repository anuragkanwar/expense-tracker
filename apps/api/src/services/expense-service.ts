import { ExpenseCreateWithDetails } from "@/dto/expenses.dto";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { UserAuth } from "@/models/auth";
import {
  TransactionRepository,
  ExpenseRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
  GroupRepository,
  BalanceRepository,
  ExpensePayerRepository,
  ExpenseSplitRepository,
  GroupMemberRepository,
} from "@/repositories";

import { ACCOUNT_TYPE, type DBType, SHARE_TYPE, TXN_TYPE } from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { GroupNotFoundError } from "@/errors/group-errors";
import { mathOperationAndGetFixedNumber } from "@/utils/mathUtils";
import { TransactionAccountResponse } from "@/models";
import { TransactionHelperService } from "./transaction-helper-service";

export class ExpenseService {
  private readonly balanceRepository;
  private readonly expensePayerRepository;
  private readonly expenseRepository;
  private readonly expenseSplitRepository;
  private readonly groupMemberRepository;
  private readonly groupRepository;
  private readonly transactionAccountRepository;
  private readonly transactionEntryRepository;
  private readonly transactionRepository;
  private readonly transactionHelperService;
  private db: DBType;
  constructor({
    balanceRepository,
    db,
    expensePayerRepository,
    expenseRepository,
    expenseSplitRepository,
    groupMemberRepository,
    groupRepository,
    transactionAccountRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionHelperService,
  }: {
    balanceRepository: BalanceRepository;
    db: DBType
    expensePayerRepository: ExpensePayerRepository;
    expenseRepository: ExpenseRepository;
    expenseSplitRepository: ExpenseSplitRepository;
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionRepository: TransactionRepository;
    transactionHelperService: TransactionHelperService;
  }) {
    this.balanceRepository = balanceRepository;
    this.db = db;
    this.expensePayerRepository = expensePayerRepository;
    this.expenseRepository = expenseRepository;
    this.expenseSplitRepository = expenseSplitRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionRepository = transactionRepository;
    this.transactionHelperService = transactionHelperService;
  }

  private async validateLoanTransaction(
    payerId: number,
    expenseCreateWithDetails: ExpenseCreateWithDetails
  ): Promise<void> {
    const {
      sourceTransactionAccountID,
      targetTransactionAccountID,
      splits,
      amount,
      type,
    } = expenseCreateWithDetails;

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

  private async validateTransactionAccounts(
    payerId: number,
    srcAccId: number,
    dstAccId: number,
    txnType: TXN_TYPE
  ): Promise<{
    srcAcc: TransactionAccountResponse;
    dstAcc: TransactionAccountResponse;
  }> {
    // For loan transactions, use specialized validation
    if (txnType === TXN_TYPE.LOAN_GIVEN || txnType === TXN_TYPE.LOAN_TAKEN) {
      // For loans, we need to find accounts by ID directly since they may belong to different users
      const txnSrcAcc =
        await this.transactionAccountRepository.findById(srcAccId);
      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc =
        await this.transactionAccountRepository.findById(dstAccId);
      if (!txnDstAcc) {
        throw new TransactionAccountNotFoundError("`to` account");
      }

      return { srcAcc: txnSrcAcc, dstAcc: txnDstAcc };
    } else {
      // For non-loan transactions, both accounts must belong to the payer
      const txnSrcAcc =
        await this.transactionAccountRepository.findByUserIdAndAccountId(
          payerId,
          srcAccId
        );

      if (!txnSrcAcc) {
        throw new TransactionAccountNotFoundError("`From` account");
      }

      const txnDstAcc =
        await this.transactionAccountRepository.findByUserIdAndAccountId(
          payerId,
          dstAccId
        );

      if (!txnDstAcc) {
        throw new TransactionAccountNotFoundError("`to` account");
      }

      return { srcAcc: txnSrcAcc, dstAcc: txnDstAcc };
    }
  }

  private async createTransactionHeader(payerId: number, description: string) {
    return await this.transactionRepository.create({
      description,
      userId: payerId,
    });
  }

  private async createExpenseAndHandleSplits(
    payerId: number,
    expenseCreateWithDetails: ExpenseCreateWithDetails,
    txnId: number,
    splits: {
      userId: number;
      amountOwed: number;
    }[]
  ) {
    const expense = await this.expenseRepository.create({
      amount: expenseCreateWithDetails.amount,
      createdBy: payerId,
      currency: "INR",
      description: expenseCreateWithDetails.description,
      groupId: expenseCreateWithDetails.groupId,
    });

    await this.expensePayerRepository.create({
      amountPaid: expenseCreateWithDetails.amount,
      expenseId: expense.id,
      userId: payerId,
    });

    if (splits.length === 0) {
      throw new ValidationError("expected splits length > 0");
    }

    for (const split of splits) {
      const payeeLoanTakenAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          split.userId,
          ACCOUNT_TYPE.LOAN_TAKEN
        );

      if (!payeeLoanTakenAcc) {
        throw new TransactionAccountNotFoundError(
          `${split.userId} , LOAN_TAKEN`
        );
      }
      const payerLoanGiveAcc =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          payerId,
          ACCOUNT_TYPE.LOAN_GIVEN
        );

      if (!payerLoanGiveAcc) {
        throw new TransactionAccountNotFoundError(`${payerId} ,  LOAN_GIVEN`);
      }

      await this.transactionHelperService.updateAccountsAndCreateEntries([
        {
          srcAcc: payerLoanGiveAcc,
          dstAcc: payeeLoanTakenAcc,
          amount: split.amountOwed,
          txnId: txnId,
        },
      ]);

      await this.updateBalances(
        payerId,
        split.userId,
        split.amountOwed,
        expenseCreateWithDetails.groupId
      );

      await this.expenseSplitRepository.create({
        amountOwed: split.amountOwed,
        expenseId: expense.id,
        userId: split.userId,
        splitType: expenseCreateWithDetails.splitType,
        metadata: expenseCreateWithDetails.description,
      });
    }
  }

  private async calculateSplits(
    expenseCreateWithDetails: ExpenseCreateWithDetails
  ): Promise<
    {
      userId: number;
      amountOwed: number;
    }[]
  > {
    const payerId = expenseCreateWithDetails.payer;
    if (!expenseCreateWithDetails.groupId) {
      throw new ValidationError(
        "group Id not mentioned when 'share type' = 'Group'"
      );
    }

    const group = await this.groupRepository.findById(
      expenseCreateWithDetails.groupId
    );

    if (!group) {
      throw new GroupNotFoundError(`${expenseCreateWithDetails.groupId}`);
    }
    const groupMembers = await this.groupMemberRepository.findByGroupId(
      group.id
    );

    if (groupMembers.length === 0) {
      throw new ValidationError("group is not valid 0 members huh");
    }

    const splitPrice = mathOperationAndGetFixedNumber(
      expenseCreateWithDetails.amount,
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
      splits.concat({
        userId: member.id,
        amountOwed: splitPrice,
      });
    }
    return splits;
  }

  private async updateBalances(
    payerId: number,
    payeeId: number,
    amount: number,
    groupId?: number
  ): Promise<void> {
    // Update user_balance table to reflect the loan relationship
    // Payee owes payer: payee (owner) owes payer (counterparty) -amount
    const payeeBalance = await this.balanceRepository.findBalance(
      payeeId,
      payerId,
      groupId
    );
    if (payeeBalance) {
      await this.balanceRepository.update(payeeBalance.id, {
        amount: payeeBalance.amount - amount,
      });
    } else {
      await this.balanceRepository.create({
        ownerId: payeeId,
        counterPartyId: payerId,
        amount: -amount,
        currency: "INR",
        groupId: groupId,
      });
    }

    // Payer is owed by payee: payer (owner) is owed by payee (counterparty) +amount
    const payerBalance = await this.balanceRepository.findBalance(
      payerId,
      payeeId,
      groupId
    );
    if (payerBalance) {
      await this.balanceRepository.update(payerBalance.id, {
        amount: payerBalance.amount + amount,
      });
    } else {
      await this.balanceRepository.create({
        ownerId: payerId,
        counterPartyId: payeeId,
        amount: amount,
        currency: "INR",
        groupId: groupId,
      });
    }
  }
  // NOTE:
  // EXPENSE => OUTGOING -> EXPENSE (categories)
  // INCOME => EXTERNAL (-) -> INCOME (+)
  // LOAN_TAKEN => LOAN_GIVEN (someones) -> LOAN_TAKEN
  // LOAN_GIVEN => LOAN_TAKEN (someones) -> LOAN_GIVEN
  async createExpense(expenseCreateWithDetails: ExpenseCreateWithDetails) {
    const payerId = expenseCreateWithDetails.payer;

    // Validate loan transactions specifically
    if (
      expenseCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
      expenseCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
    ) {
      await this.validateLoanTransaction(payerId, expenseCreateWithDetails);
    }

    await this.db.transaction(async (tx) => {
      try {
        const { srcAcc, dstAcc } = await this.validateTransactionAccounts(
          payerId,
          expenseCreateWithDetails.sourceTransactionAccountID,
          expenseCreateWithDetails.targetTransactionAccountID,
          expenseCreateWithDetails.type
        );

        const txnHeader = await this.createTransactionHeader(
          payerId,
          expenseCreateWithDetails.description
        );

        if (
          expenseCreateWithDetails.type === TXN_TYPE.EXPENSE ||
          expenseCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN ||
          expenseCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN
        ) {
          if (expenseCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
            await this.transactionHelperService.updateAccountsAndCreateEntries([
              {
                srcAcc,
                dstAcc,
                amount: expenseCreateWithDetails.amount,
                txnId: txnHeader.id,
              },
            ]);
          } else if (
            expenseCreateWithDetails.sharedWith === SHARE_TYPE.GROUP ||
            expenseCreateWithDetails.sharedWith === SHARE_TYPE.FRIENDS
          ) {
            if (!expenseCreateWithDetails.splitType) {
              throw new ValidationError("Split type must be set");
            }

            const splits =
              expenseCreateWithDetails.splits ??
              (await this.calculateSplits(expenseCreateWithDetails));

            const splitTotal = splits.reduce(
              (acc, split) => acc + split.amountOwed,
              0
            );
            const payerTotal = expenseCreateWithDetails.amount - splitTotal;
            await this.transactionHelperService.updateAccountsAndCreateEntries([
              {
                srcAcc: srcAcc,
                dstAcc: dstAcc,
                amount: payerTotal,
                txnId: txnHeader.id,
              },
            ]);

            await this.createExpenseAndHandleSplits(
              payerId,
              expenseCreateWithDetails,
              txnHeader.id,
              splits
            );
          } else {
            throw new NotFoundError("Provided share type not found");
          }
        } else if (
          expenseCreateWithDetails.type === TXN_TYPE.INCOME ||
          expenseCreateWithDetails.type === TXN_TYPE.SAVING
        ) {
          await this.transactionHelperService.updateAccountsAndCreateEntries([
            {
              srcAcc,
              dstAcc,
              amount: expenseCreateWithDetails.amount,
              txnId: txnHeader.id,
            },
          ]);
        } else {
          throw new NotFoundError("Provided txn type not found");
        }
      } catch (error: any) {
        tx.rollback();
        throw error;
      }
    });
  }

  // TODO: Implement expense service methods
}
