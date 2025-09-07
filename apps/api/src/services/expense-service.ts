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

import { ACCOUNT_TYPE, db as DATABASE, SHARE_TYPE, TXN_TYPE } from "@/db";
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
  private db: typeof DATABASE;
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
    db: typeof DATABASE;
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

  private async validateTransactionAccounts(
    payerId: number,
    srcAccId: number,
    dstAccId: number
  ): Promise<{
    srcAcc: TransactionAccountResponse;
    dstAcc: TransactionAccountResponse;
  }> {
    const srcAcc =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        payerId,
        srcAccId
      );

    if (!srcAcc) {
      throw new TransactionAccountNotFoundError("`From` account");
    }

    const dstTransactionAcc =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        payerId,
        dstAccId
      );

    if (!dstTransactionAcc) {
      throw new TransactionAccountNotFoundError("`to` account");
    }

    return { srcAcc: srcAcc, dstAcc: dstTransactionAcc };
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

  private async updateBalances() {}
  // NOTE:
  // EXPENSE => OUTGOING -> EXPENSE (categories)
  // INCOME => EXTERNAL (-) -> INCOME (+)
  // LOAN_TAKEN => LOAN_GIVEN (someones) -> LOAN_TAKEN
  // LOAN_GIVEN => LOAN_TAKEN (someones) -> LOAN_GIVEN
  async createExpense(expenseCreateWithDetails: ExpenseCreateWithDetails) {
    const payerId = expenseCreateWithDetails.payer;
    await this.db.transaction(async (tx) => {
      try {
        const { srcAcc, dstAcc } = await this.validateTransactionAccounts(
          payerId,
          expenseCreateWithDetails.sourceTransactionAccountID,
          expenseCreateWithDetails.targetTransactionAccountID
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
