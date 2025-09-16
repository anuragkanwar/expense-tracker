import type {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@pocket-pixie/contracts";
import { z } from "zod";
import type {
  BalanceSummaryResponseSchema,
  FriendBalanceResponseSchema,
  GroupBalanceResponseSchema,
  BalancesSettlementPlanResponseSchema,
} from "@pocket-pixie/contracts";

type BalanceSummaryResponse = z.infer<typeof BalanceSummaryResponseSchema>;
type FriendBalanceResponse = z.infer<typeof FriendBalanceResponseSchema>;
type GroupBalanceResponse = z.infer<typeof GroupBalanceResponseSchema>;
type SettlementPlanResponse = z.infer<
  typeof BalancesSettlementPlanResponseSchema
>;
import { BadRequestError } from "../errors/base-error";
import { BalanceRepository } from "@/repositories/balance-repository";
import { UserRepository } from "@/repositories/user-repository";
import { GroupRepository } from "@/repositories/group-repository";
import { GroupMemberRepository } from "@/repositories/group-member-repository";
import { TransactionRepository } from "@/repositories/transaction-repository";

import { TransactionAccountRepository } from "@/repositories/transaction-account-repository";
import { TransactionHelperService } from "./transaction-helper-service";
import { ACCOUNT_TYPE, type DBType, type DBTransactionType } from "@/db";

export class BalanceService {
  private readonly balanceRepository;
  private readonly userRepository;
  private readonly groupRepository;
  private readonly groupMemberRepository;
  private readonly transactionRepository;

  private readonly transactionAccountRepository;
  private readonly transactionHelperService;
  private db: DBType;

  constructor({
    balanceRepository,
    userRepository,
    groupRepository,
    groupMemberRepository,
    transactionRepository,
    transactionAccountRepository,
    transactionHelperService,
    db,
  }: {
    balanceRepository: BalanceRepository;
    userRepository: UserRepository;
    groupRepository: GroupRepository;
    groupMemberRepository: GroupMemberRepository;
    transactionRepository: TransactionRepository;
    transactionAccountRepository: TransactionAccountRepository;
    transactionHelperService: TransactionHelperService;
    db: DBType;
  }) {
    this.balanceRepository = balanceRepository;
    this.userRepository = userRepository;
    this.groupRepository = groupRepository;
    this.groupMemberRepository = groupMemberRepository;
    this.transactionRepository = transactionRepository;
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

    let netBalance = 0;
    let currency = "USD";

    for (const balance of balances) {
      if (balance.ownerId === userId && balance.counterPartyId === friendId) {
        netBalance = balance.amount;
        currency = balance.currency;
        break; // Use the net balance from user's perspective
      }
    }

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
}
