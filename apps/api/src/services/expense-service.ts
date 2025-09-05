import { ExpenseCreateWithDetails } from "@/dto/expenses.dto";
import { InternalServerError } from "@/errors/base-error";
import { CategoryNotFoundError } from "@/errors/category-errors";
import { UserResponse } from "@/models";
import { UserAuth } from "@/models/auth";
import {
  TransactionRepository,
  ExpenseRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
  CategoryRepository,
} from "@/repositories";

import { db as DATABASE, SHARE_TYPE, TXN_TYPE } from "@pocket-pixie/db";

export class ExpenseService {
  private readonly expenseRepository;
  private readonly transactionRepository;
  private readonly transactionAccountRepository;
  private readonly transactionEntryRepository;
  private readonly categoryRepository;
  private db: typeof DATABASE;
  constructor({
    expenseRepository,
    transactionRepository,
    transactionAccountRepository,
    transactionEntryRepository,
    categoryRepository,
    db,
  }: {
    expenseRepository: ExpenseRepository;
    transactionRepository: TransactionRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionEntryRepository: TransactionEntryRepository;
    categoryRepository: CategoryRepository;
    db: typeof DATABASE;
  }) {
    this.expenseRepository = expenseRepository;
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.categoryRepository = categoryRepository;
    this.db = db;
  }

  async createExpense(
    expenseCreateWithDetails: ExpenseCreateWithDetails,
    user: UserAuth
  ) {
    const userId = parseInt(user.id);

    const data = await this.db.transaction(async (tx) => {
      if (expenseCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
        //categoryId
        const category = await this.categoryRepository.findByUserIdAndName(
          userId,
          expenseCreateWithDetails.category
        );

        if (!category) {
          throw new CategoryNotFoundError(expenseCreateWithDetails.category);
        }

        // transaction Account

        let tranasctionAcc =
          await this.transactionAccountRepository.findByUserIdAndCategoryName(
            userId,
            expenseCreateWithDetails.category
          );

        if (tranasctionAcc === null) {
          tranasctionAcc = await this.transactionAccountRepository.create({
            balance: 0,
            category: expenseCreateWithDetails.category,
            currency: user.currency || "INR",
            name: expenseCreateWithDetails.category,
            userId: userId,
          });
        }

        let transactionMainAcc =
          await this.transactionAccountRepository.findMainAccountByUser(userId);

        if (transactionMainAcc === null) {
          throw new InternalServerError("MAIN acc creation failed");
        }
        const txnHeader = await this.transactionRepository.create({
          description: expenseCreateWithDetails.description,
          userId: userId,
        });

        if (expenseCreateWithDetails.type === TXN_TYPE.EXPENSE) {
          await this.transactionAccountRepository.update(
            transactionMainAcc.id,
            {
              balance:
                transactionMainAcc.balance - expenseCreateWithDetails.amount,
            }
          );

          await this.transactionAccountRepository.update(tranasctionAcc.id, {
            balance: tranasctionAcc.balance + expenseCreateWithDetails.amount,
          });

          await this.transactionEntryRepository.create({
            amount: expenseCreateWithDetails.amount,
            categoryId: category.id,
            transactionAccountId: tranasctionAcc.id,
            transactionId: txnHeader.id,
            type: expenseCreateWithDetails.type,
          });

          await this.transactionEntryRepository.create({
            amount: -expenseCreateWithDetails.amount,
            categoryId: category.id,
            transactionAccountId: transactionMainAcc.id,
            transactionId: txnHeader.id,
            type: expenseCreateWithDetails.type,
          });
        }
      }
    });
  }
  // TODO: Implement expense service methods
}
