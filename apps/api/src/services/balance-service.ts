import type {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@/models/user-balance";
import type { SettlementCreate } from "@/models/settlement";
import { z } from "zod";
import type {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  SettlementPlanResponseSchema,
} from "@/dto/balances.dto";

type BalanceSummaryResponse = z.infer<typeof BalanceSummaryResponseSchema>;
type FriendBalanceResponse = z.infer<typeof FriendBalanceResponseSchema>;
type GroupBalanceResponse = z.infer<typeof GroupBalanceResponseSchema>;
type SettlementPlanResponse = z.infer<typeof SettlementPlanResponseSchema>;
import { BadRequestError, InternalServerError } from "../errors/base-error";
import { BalanceRepository } from "@/repositories/balance-repository";
import { SettlementRepository } from "@/repositories/settlement-repository";
import { UserRepository } from "@/repositories/user-repository";
import { GroupRepository } from "@/repositories/group-repository";
import { GroupMemberRepository } from "@/repositories/group-member-repository";
import { TransactionRepository } from "@/repositories/transaction-repository";
import { TransactionEntryRepository } from "@/repositories/transaction-entry-repository";
import { TransactionAccountRepository } from "@/repositories/transaction-account-repository";
import { TransactionHelperService } from "./transaction-helper-service";
import { ACCOUNT_TYPE, type DBType } from "@/db";

export class BalanceService {
  private readonly balanceRepository;
  private readonly settlementRepository;
  private readonly userRepository;
  private readonly groupRepository;
  private readonly groupMemberRepository;
  private readonly transactionRepository;
  private readonly transactionEntryRepository;
  private readonly transactionAccountRepository;
  private readonly transactionHelperService;
  private db: DBType;

  constructor({
    balanceRepository,
    settlementRepository,
    userRepository,
    groupRepository,
    groupMemberRepository,
    transactionRepository,
    transactionEntryRepository,
    transactionAccountRepository,
    transactionHelperService,
    db,
  }: {
    balanceRepository: BalanceRepository;
    settlementRepository: SettlementRepository;
    userRepository: UserRepository;
    groupRepository: GroupRepository;
    groupMemberRepository: GroupMemberRepository;
    transactionRepository: TransactionRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionHelperService: TransactionHelperService;
    db: DBType;
  }) {
    this.balanceRepository = balanceRepository;
    this.settlementRepository = settlementRepository;
    this.userRepository = userRepository;
    this.groupRepository = groupRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
    this.transactionHelperService = transactionHelperService;
    this.db = db;
  }

  async getAllBalances(
    limit: number = 10,
    offset: number = 0
  ): Promise<UserBalanceResponse[]> {
    return this.balanceRepository.findAll(limit, offset);
  }

  async getBalanceById(id: string): Promise<UserBalanceResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid balance ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid balance ID format");
    }

    return this.balanceRepository.findById(numericId);
  }

  async create(data: UserBalanceCreate): Promise<UserBalanceResponse> {
    return this.balanceRepository.create(data);
  }

  async updateBalance(
    id: string,
    data: UserBalanceUpdate
  ): Promise<UserBalanceResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid balance ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid balance ID format");
    }

    const existingBalance = await this.balanceRepository.findById(numericId);
    if (!existingBalance) {
      return null;
    }

    return this.balanceRepository.update(numericId, data);
  }

  async deleteBalance(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid balance ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid balance ID format");
    }

    const existingBalance = await this.balanceRepository.findById(numericId);
    if (!existingBalance) {
      throw new BadRequestError("Balance not found");
    }

    return this.balanceRepository.delete(numericId);
  }

  async getBalanceSummary(userId: number): Promise<BalanceSummaryResponse> {
    const balances = await this.balanceRepository.getUserBalances(userId);

    // Calculate totals
    let totalOwed = 0;
    let totalOwe = 0;
    let primaryCurrency = "USD";

    for (const balance of balances) {
      if (balance.amount > 0) {
        totalOwed += balance.amount;
      } else {
        totalOwe += Math.abs(balance.amount);
      }
      if (!primaryCurrency || balance.currency === "USD") {
        primaryCurrency = balance.currency;
      }
    }

    return {
      totalOwed,
      totalOwe,
      netBalance: totalOwed - totalOwe,
      currency: primaryCurrency,
    };
  }

  async getFriendBalance(
    userId: number,
    friendId: number
  ): Promise<FriendBalanceResponse> {
    const balances = await this.balanceRepository.getBalancesBetweenUsers(
      userId,
      friendId
    );

    let userOwes = 0;
    let friendOwes = 0;
    let currency = "USD";

    for (const balance of balances) {
      if (balance.ownerId === userId && balance.counterPartyId === friendId) {
        userOwes = balance.amount;
        currency = balance.currency;
      } else if (
        balance.ownerId === friendId &&
        balance.counterPartyId === userId
      ) {
        friendOwes = balance.amount;
      }
    }

    const netBalance = friendOwes - userOwes; // Positive means friend owes user

    // Get friend name
    const friend = await this.userRepository.findById(friendId);

    return {
      friendId,
      friendName: friend?.name || "Unknown",
      balance: netBalance,
      currency,
      lastActivity: new Date().toISOString(), // Could be improved with actual activity tracking
    };
  }

  async getGroupBalance(
    userId: number,
    groupId: number
  ): Promise<GroupBalanceResponse> {
    const balances = await this.balanceRepository.getGroupBalances(
      userId,
      groupId
    );
    const groupInfo = await this.groupRepository.findById(groupId);
    const groupMembers =
      await this.groupMemberRepository.findByGroupId(groupId);

    // Calculate net balance
    let totalBalance = 0;
    let currency = "USD";

    for (const balance of balances) {
      totalBalance += balance.amount;
      currency = balance.currency;
    }

    return {
      groupId,
      groupName: groupInfo?.name || "Unknown Group",
      balance: totalBalance,
      currency,
      memberCount: groupMembers.length,
    };
  }

  async createSettlement(data: SettlementCreate): Promise<void> {
    this.db.transaction(async (tx) => {
      try {
        // Validate users exist and are different
        if (data.payerId === data.payeeId) {
          throw new BadRequestError("Cannot settle with self");
        }

        const payer = await this.userRepository.findById(data.payerId, tx);
        const payee = await this.userRepository.findById(data.payeeId, tx);

        if (!payer || !payee) {
          throw new BadRequestError("Invalid payer or payee");
        }

        // Create transaction header for the settlement
        const transaction = await this.transactionRepository.create(
          {
            description: `Direct settlement: ${payer.name} paid ${data.amount} ${data.currency} to ${payee.name}`,
            userId: data.payerId,
          },
          tx
        );

        // Get payer's OUTGOING account (money going out)
        const payerOutgoingAcc =
          await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
            data.payerId,
            ACCOUNT_TYPE.OUTGOING,
            tx
          );

        if (!payerOutgoingAcc) {
          throw new BadRequestError("Payer's outgoing account not found");
        }

        // Get payee's EXPENSE account (money coming in as income)
        const payeeExpenseAcc =
          await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
            data.payeeId,
            ACCOUNT_TYPE.EXPENSE,
            tx
          );

        if (!payeeExpenseAcc) {
          throw new BadRequestError("Payee's expense account not found");
        }

        // Record the actual payment: OUTGOING (-) → EXPENSE (+)
        await this.transactionHelperService.updateAccountsAndCreateEntries(
          [
            {
              srcAcc: payerOutgoingAcc,
              dstAcc: payeeExpenseAcc,
              amount: data.amount,
              txnId: transaction.id,
            },
          ],
          tx
        );

        // Also reverse the loan relationship: LOAN_TAKEN (-) → LOAN_GIVEN (+)
        // This represents the debt being settled
        const payerLoanTakenAcc =
          await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
            data.payerId,
            ACCOUNT_TYPE.LOAN_TAKEN,
            tx
          );

        const payeeLoanGivenAcc =
          await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
            data.payeeId,
            ACCOUNT_TYPE.LOAN_GIVEN,
            tx
          );

        if (payerLoanTakenAcc && payeeLoanGivenAcc) {
          // Create another transaction for the loan reversal
          const loanReversalTxn = await this.transactionRepository.create(
            {
              description: `Loan reversal: Debt between ${payer.name} and ${payee.name} settled`,
              userId: data.payerId,
            },
            tx
          );

          await this.transactionHelperService.updateAccountsAndCreateEntries(
            [
              {
                srcAcc: payerLoanTakenAcc,
                dstAcc: payeeLoanGivenAcc,
                amount: data.amount,
                txnId: loanReversalTxn.id,
              },
            ],
            tx
          );
        }

        // Update overall balances for both sides
        // Payer's balance with payee: payer (owner) pays payee (counterparty) -amount
        const payerBalance = await this.balanceRepository.findBalance(
          data.payerId,
          data.payeeId,
          undefined,
          tx
        );
        if (payerBalance) {
          await this.balanceRepository.update(
            payerBalance.id,
            {
              amount: payerBalance.amount - data.amount,
            },
            tx
          );
        } else {
          // If no balance, create with -amount (payer now owes less or is owed more)
          await this.balanceRepository.create(
            {
              ownerId: data.payerId,
              counterPartyId: data.payeeId,
              amount: -data.amount,
              currency: data.currency,
              groupId: undefined,
            },
            tx
          );
        }

        // Payee's balance with payer: payee (owner) receives from payer (counterparty) +amount
        const payeeBalance = await this.balanceRepository.findBalance(
          data.payeeId,
          data.payerId,
          undefined,
          tx
        );
        if (payeeBalance) {
          await this.balanceRepository.update(
            payeeBalance.id,
            {
              amount: payeeBalance.amount + data.amount,
            },
            tx
          );
        } else {
          await this.balanceRepository.create(
            {
              ownerId: data.payeeId,
              counterPartyId: data.payerId,
              amount: data.amount,
              currency: data.currency,
              groupId: undefined,
            },
            tx
          );
        }

        // If groupId provided, also update group-specific balances
        if (data.groupId) {
          const payerGroupBalance = await this.balanceRepository.findBalance(
            data.payerId,
            data.payeeId,
            data.groupId,
            tx
          );
          if (payerGroupBalance) {
            await this.balanceRepository.update(
              payerGroupBalance.id,
              {
                amount: payerGroupBalance.amount - data.amount,
              },
              tx
            );
          } else {
            await this.balanceRepository.create(
              {
                ownerId: data.payerId,
                counterPartyId: data.payeeId,
                amount: -data.amount,
                currency: data.currency,
                groupId: data.groupId,
              },
              tx
            );
          }

          const payeeGroupBalance = await this.balanceRepository.findBalance(
            data.payeeId,
            data.payerId,
            data.groupId,
            tx
          );
          if (payeeGroupBalance) {
            await this.balanceRepository.update(
              payeeGroupBalance.id,
              {
                amount: payeeGroupBalance.amount + data.amount,
              },
              tx
            );
          } else {
            await this.balanceRepository.create(
              {
                ownerId: data.payeeId,
                counterPartyId: data.payerId,
                amount: data.amount,
                currency: data.currency,
                groupId: data.groupId,
              },
              tx
            );
          }
        }

        // Create the settlement record
        const settlementData = {
          ...data,
          settledAt: data.settledAt || new Date().toISOString(),
        };
        await this.settlementRepository.create(settlementData, tx);
      } catch (error: any) {
        console.log(error);
        tx.rollback();
        throw new InternalServerError("setllement failed");
      }
    });
  }

  async getGlobalSettlementPlan(
    userId: number
  ): Promise<SettlementPlanResponse> {
    const debts = await this.balanceRepository.getUserDebts(userId);
    const settlements: SettlementPlanResponse = [];

    for (const debt of debts) {
      const creditor = await this.userRepository.findById(debt.counterPartyId);

      settlements.push({
        fromUserId: userId,
        fromUserName: "You", // Current user
        toUserId: debt.counterPartyId,
        toUserName: creditor?.name || "Unknown",
        amount: Math.abs(debt.amount),
        currency: debt.currency,
      });
    }

    return settlements;
  }

  async getGroupSettlementPlan(
    userId: number,
    groupId: number
  ): Promise<SettlementPlanResponse> {
    const balances = await this.balanceRepository.getGroupBalancesForSettlement(
      userId,
      groupId
    );
    const settlements: SettlementPlanResponse = [];

    for (const balance of balances) {
      if (balance.amount < 0) {
        // owner owes counterparty
        const owner = await this.userRepository.findById(balance.ownerId);
        const counterparty = await this.userRepository.findById(
          balance.counterPartyId
        );

        settlements.push({
          fromUserId: balance.ownerId,
          fromUserName: owner?.name || "Unknown",
          toUserId: balance.counterPartyId,
          toUserName: counterparty?.name || "Unknown",
          amount: Math.abs(balance.amount),
          currency: balance.currency,
        });
      }
    }

    return settlements;
  }

  async recordLoan(
    lenderId: number,
    borrowerId: number,
    amount: number,
    currency: string = "INR",
    groupId?: number
  ): Promise<void> {
    if (lenderId === borrowerId) {
      throw new BadRequestError("Cannot record loan to self");
    }

    const lender = await this.userRepository.findById(lenderId);
    const borrower = await this.userRepository.findById(borrowerId);

    if (!lender || !borrower) {
      throw new BadRequestError("Invalid lender or borrower");
    }

    // Create transaction header for the loan
    const transaction = await this.transactionRepository.create({
      description: `Direct loan: ${lender.name} lent ${amount} ${currency} to ${borrower.name}`,
      userId: lenderId,
    });

    // Get lender's LOAN_GIVEN account
    const lenderLoanGivenAcc =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        lenderId,
        ACCOUNT_TYPE.LOAN_GIVEN
      );

    if (!lenderLoanGivenAcc) {
      throw new BadRequestError("Lender's loan given account not found");
    }

    // Get borrower's LOAN_TAKEN account
    const borrowerLoanTakenAcc =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        borrowerId,
        ACCOUNT_TYPE.LOAN_TAKEN
      );

    if (!borrowerLoanTakenAcc) {
      throw new BadRequestError("Borrower's loan taken account not found");
    }

    // Create transaction entries using helper service
    await this.transactionHelperService.updateAccountsAndCreateEntries([
      {
        srcAcc: lenderLoanGivenAcc,
        dstAcc: borrowerLoanTakenAcc,
        amount: amount,
        txnId: transaction.id,
      },
    ]);

    // Update or create overall balances for both sides
    // Borrower owes lender: borrower (owner) owes lender (counterparty) -amount
    const borrowerBalance = await this.balanceRepository.findBalance(
      borrowerId,
      lenderId,
      null
    );
    if (borrowerBalance) {
      await this.balanceRepository.update(borrowerBalance.id, {
        amount: borrowerBalance.amount - amount,
      });
    } else {
      await this.balanceRepository.create({
        ownerId: borrowerId,
        counterPartyId: lenderId,
        amount: -amount,
        currency: currency,
        groupId: undefined,
      });
    }

    // Lender is owed by borrower: lender (owner) is owed by borrower (counterparty) +amount
    const lenderBalance = await this.balanceRepository.findBalance(
      lenderId,
      borrowerId,
      null
    );
    if (lenderBalance) {
      await this.balanceRepository.update(lenderBalance.id, {
        amount: lenderBalance.amount + amount,
      });
    } else {
      await this.balanceRepository.create({
        ownerId: lenderId,
        counterPartyId: borrowerId,
        amount: amount,
        currency: currency,
        groupId: undefined,
      });
    }

    // If groupId provided, also update or create group-specific balances
    if (groupId) {
      const borrowerGroupBalance = await this.balanceRepository.findBalance(
        borrowerId,
        lenderId,
        groupId
      );
      if (borrowerGroupBalance) {
        await this.balanceRepository.update(borrowerGroupBalance.id, {
          amount: borrowerGroupBalance.amount - amount,
        });
      } else {
        await this.balanceRepository.create({
          ownerId: borrowerId,
          counterPartyId: lenderId,
          amount: -amount,
          currency: currency,
          groupId: groupId,
        });
      }

      const lenderGroupBalance = await this.balanceRepository.findBalance(
        lenderId,
        borrowerId,
        groupId
      );
      if (lenderGroupBalance) {
        await this.balanceRepository.update(lenderGroupBalance.id, {
          amount: lenderGroupBalance.amount + amount,
        });
      } else {
        await this.balanceRepository.create({
          ownerId: lenderId,
          counterPartyId: borrowerId,
          amount: amount,
          currency: currency,
          groupId: groupId,
        });
      }
    }
  }
}
