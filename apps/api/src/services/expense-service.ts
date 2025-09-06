import { ExpenseCreateWithDetails } from "@/dto/expenses.dto";
import { TransactionAccountNotFoundError } from "@/errors/transaction-account-errors";
import { UserAuth } from "@/models/auth";
import {
  TransactionRepository,
  ExpenseRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
} from "@/repositories";

import { db as DATABASE, SHARE_TYPE, TXN_TYPE } from "@/db";

export class ExpenseService {
  private readonly expenseRepository;
  private readonly transactionRepository;
  private readonly transactionAccountRepository;
  private readonly transactionEntryRepository;
  private db: typeof DATABASE;
  constructor({
    expenseRepository,
    transactionRepository,
    transactionAccountRepository,
    transactionEntryRepository,
    db,
  }: {
    expenseRepository: ExpenseRepository;
    transactionRepository: TransactionRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionEntryRepository: TransactionEntryRepository;
    db: typeof DATABASE;
  }) {
    this.expenseRepository = expenseRepository;
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.db = db;
  }

  async createExpense(
    expenseCreateWithDetails: ExpenseCreateWithDetails,
    user: UserAuth
  ) {
    const userId = parseInt(user.id);

    await this.db.transaction(async (tx) => {
      if (expenseCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
        // transaction Account

        console.log(`userId is : ${userId}`);
        let srcTransactionAcc =
          await this.transactionAccountRepository.findByUserIdAndAccountId(
            userId,
            expenseCreateWithDetails.sourceTransactionAccountID
          );

        if (!srcTransactionAcc) {
          throw new TransactionAccountNotFoundError("`From` account");
        }
        let dstTranasctionAcc =
          await this.transactionAccountRepository.findByUserIdAndAccountId(
            userId,
            expenseCreateWithDetails.targetTransactionAccountID
          );

        if (!dstTranasctionAcc) {
          throw new TransactionAccountNotFoundError("`to` account");
        }

        const txnHeader = await this.transactionRepository.create({
          description: expenseCreateWithDetails.description,
          userId: userId,
        });

        if (expenseCreateWithDetails.type === TXN_TYPE.EXPENSE) {
          await this.transactionAccountRepository.update(srcTransactionAcc.id, {
            balance:
              srcTransactionAcc.balance - expenseCreateWithDetails.amount,
          });

          await this.transactionAccountRepository.update(dstTranasctionAcc.id, {
            balance:
              dstTranasctionAcc.balance + expenseCreateWithDetails.amount,
          });

          await this.transactionEntryRepository.create({
            amount: expenseCreateWithDetails.amount,
            transactionAccountId: dstTranasctionAcc.id,
            transactionId: txnHeader.id,
          });

          await this.transactionEntryRepository.create({
            amount: -expenseCreateWithDetails.amount,
            transactionAccountId: srcTransactionAcc.id,
            transactionId: txnHeader.id,
          });
        }
      }
    });
  }
  // TODO: Implement expense service methods
}
