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

import {
  ACCOUNT_TYPE,
  db as DATABASE,
  SHARE_TYPE,
  SPLIT_TYPE,
  TXN_TYPE,
} from "@/db";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { GroupNotFoundError } from "@/errors/group-errors";
import { mathOperationAndGetFixedNumber } from "@/utils/mathUtils";

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
  }

  // NOTE:
  // EXPENSE => OUTGOING -> EXPENSE (categories)
  // INCOME => EXTERNAL -> INCOME
  // LOAN_TAKEN => LOAN_GIVEN (someones) -> LOAN_TAKEN
  // LOAN_GIVEN => LOAN_TAKEN (someones) -> LOAN_GIVEN
  async createExpense(expenseCreateWithDetails: ExpenseCreateWithDetails) {
    const payerId = expenseCreateWithDetails.payer;
    await this.db.transaction(async (tx) => {
      try {
        const srcTransactionAcc =
          await this.transactionAccountRepository.findByUserIdAndAccountId(
            payerId,
            expenseCreateWithDetails.sourceTransactionAccountID
          );

        if (!srcTransactionAcc) {
          throw new TransactionAccountNotFoundError("`From` account");
        }
        const dstTranasctionAcc =
          await this.transactionAccountRepository.findByUserIdAndAccountId(
            payerId,
            expenseCreateWithDetails.targetTransactionAccountID
          );

        if (!dstTranasctionAcc) {
          throw new TransactionAccountNotFoundError("`to` account");
        }

        const txnHeader = await this.transactionRepository.create({
          description: expenseCreateWithDetails.description,
          userId: payerId,
        });

        if (expenseCreateWithDetails.type === TXN_TYPE.EXPENSE) {
          if (expenseCreateWithDetails.sharedWith === SHARE_TYPE.NONE) {
            await this.transactionAccountRepository.update(
              srcTransactionAcc.id,
              {
                balance:
                  srcTransactionAcc.balance - expenseCreateWithDetails.amount,
              }
            );

            await this.transactionAccountRepository.update(
              dstTranasctionAcc.id,
              {
                balance:
                  dstTranasctionAcc.balance + expenseCreateWithDetails.amount,
              }
            );

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
          } else if (
            expenseCreateWithDetails.sharedWith === SHARE_TYPE.GROUP ||
            expenseCreateWithDetails.sharedWith === SHARE_TYPE.FRIENDS
          ) {
            if (!expenseCreateWithDetails.splitType) {
              throw new ValidationError("Split type must be set");
            }

            let splits = expenseCreateWithDetails.splits ?? [];
            if (
              expenseCreateWithDetails.sharedWith === SHARE_TYPE.GROUP &&
              expenseCreateWithDetails.splitType === SPLIT_TYPE.EQUAL
            ) {
              if (!expenseCreateWithDetails.groupId) {
                throw new ValidationError(
                  "group Id not mentioned when `share type` = `Group`"
                );
              }

              const group = await this.groupRepository.findById(
                expenseCreateWithDetails.groupId
              );

              if (!group) {
                throw new GroupNotFoundError(
                  `${expenseCreateWithDetails.groupId}`
                );
              }
              const groupMembers =
                await this.groupMemberRepository.findByGroupId(group.id);

              if (groupMembers.length === 0) {
                throw new ValidationError(
                  "group is not valid 0 members huh ??"
                );
              }
              const splitPrice = mathOperationAndGetFixedNumber(
                expenseCreateWithDetails.amount,
                groupMembers.length,
                (a, b) => a * b
              );
              for (const member of groupMembers) {
                if (member.id === payerId) {
                  continue;
                }
                splits.concat({
                  userId: member.id,
                  amountOwed: splitPrice,
                });
              }
            }

            const splitTotal = splits.reduce(
              (acc, split) => acc + split.amountOwed,
              0
            );

            const payerTotal = expenseCreateWithDetails.amount - splitTotal;

            console.log(
              expenseCreateWithDetails.amount,
              splitTotal,
              payerTotal
            );
            // payer
            await this.transactionAccountRepository.update(
              srcTransactionAcc.id,
              {
                balance: srcTransactionAcc.balance - payerTotal,
              }
            );

            await this.transactionAccountRepository.update(
              dstTranasctionAcc.id,
              {
                balance: dstTranasctionAcc.balance + payerTotal,
              }
            );

            await this.transactionEntryRepository.create({
              amount: payerTotal,
              transactionAccountId: dstTranasctionAcc.id,
              transactionId: txnHeader.id,
            });

            await this.transactionEntryRepository.create({
              amount: -payerTotal,
              transactionAccountId: srcTransactionAcc.id,
              transactionId: txnHeader.id,
            });

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

            let payerLoanGiveAcc =
              await this.transactionAccountRepository.findByUserIdAndCategoryName(
                payerId,
                ACCOUNT_TYPE.LOAN_GIVEN
              );
            if (!payerLoanGiveAcc) {
              throw new TransactionAccountNotFoundError(
                `${payerId} ,  LOAN_GIVEN`
              );
            }

            // payer single entry for loan given
            await this.transactionEntryRepository.create({
              amount: -expenseCreateWithDetails.amount + payerTotal,
              transactionAccountId: payerLoanGiveAcc.id,
              transactionId: txnHeader.id,
            });

            if (splits.length === 0) {
              throw new ValidationError("expected splits length > 0");
            }

            for (const split of splits) {
              console.log(split);
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
              payerLoanGiveAcc = await this.transactionAccountRepository.update(
                payerLoanGiveAcc.id,
                {
                  balance: payerLoanGiveAcc.balance - split.amountOwed,
                }
              );
              if (!payerLoanGiveAcc) {
                throw new TransactionAccountNotFoundError(
                  `${payerId} ,  LOAN_GIVEN`
                );
              }

              await this.transactionAccountRepository.update(
                payeeLoanTakenAcc.id,
                {
                  balance: payeeLoanTakenAcc.balance + split.amountOwed,
                }
              );

              await this.transactionEntryRepository.create({
                amount: split.amountOwed,
                transactionAccountId: payeeLoanTakenAcc.id,
                transactionId: txnHeader.id,
              });

              await this.expenseSplitRepository.create({
                amountOwed: split.amountOwed,
                expenseId: expense.id,
                userId: split.userId,
                splitType: expenseCreateWithDetails.splitType,
                metadata: expenseCreateWithDetails.description,
              });
            }
          } else {
            throw new NotFoundError("Provided share type not found");
          }
        } else if (expenseCreateWithDetails.type === TXN_TYPE.INCOME) {
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
        } else if (expenseCreateWithDetails.type === TXN_TYPE.LOAN_GIVEN) {
          // await this.transactionAccountRepository.update(srcTransactionAcc.id, {
          //   balance:
          //     srcTransactionAcc.balance + expenseCreateWithDetails.amount,
          // });
          //
          // await this.transactionAccountRepository.update(dstTranasctionAcc.id, {
          //   balance:
          //     dstTranasctionAcc.balance + expenseCreateWithDetails.amount,
          // });
          //
          // await this.transactionEntryRepository.create({
          //   amount: expenseCreateWithDetails.amount,
          //   transactionAccountId: dstTranasctionAcc.id,
          //   transactionId: txnHeader.id,
          // });
          //
          // await this.transactionEntryRepository.create({
          //   amount: expenseCreateWithDetails.amount,
          //   transactionAccountId: srcTransactionAcc.id,
          //   transactionId: txnHeader.id,
          // });
          //
          // const expense = await this.expenseRepository.create({
          //   amount: expenseCreateWithDetails.amount,
          //   createdBy: payerId,
          //   currency: "INR",
          //   description: expenseCreateWithDetails.description,
          // });
          //
          // await this.expensePayerRepository.create({
          //   amountPaid: expenseCreateWithDetails.amount,
          //   expenseId: expense.id,
          //   userId: payerId,
          // });
        } else if (expenseCreateWithDetails.type === TXN_TYPE.LOAN_TAKEN) {
          // await this.transactionAccountRepository.update(srcTransactionAcc.id, {
          //   balance:
          //     srcTransactionAcc.balance - expenseCreateWithDetails.amount,
          // });
          //
          // await this.transactionAccountRepository.update(dstTranasctionAcc.id, {
          //   balance:
          //     dstTranasctionAcc.balance + expenseCreateWithDetails.amount,
          // });
          //
          // await this.transactionEntryRepository.create({
          //   amount: expenseCreateWithDetails.amount,
          //   transactionAccountId: dstTranasctionAcc.id,
          //   transactionId: txnHeader.id,
          // });
          //
          // await this.transactionEntryRepository.create({
          //   amount: -expenseCreateWithDetails.amount,
          //   transactionAccountId: srcTransactionAcc.id,
          //   transactionId: txnHeader.id,
          // });
        } else if (expenseCreateWithDetails.type === TXN_TYPE.SAVING) {
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
        } else {
          throw new NotFoundError("Provided txn type not found");
        }
      } catch (error: any) {
        tx.rollback();
        console.log(error);
        throw error;
      }
    });
  }
  // TODO: Implement expense service methods
}
