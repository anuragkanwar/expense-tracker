import type { GroupResponse, GroupCreate, GroupUpdate } from "@/models/group";
import type {
  GroupBalancesResponse,
  SettlementPlanResponse,
} from "@/dto/groups.dto";
import { BadRequestError } from "../errors/base-error";
import { GroupRepository } from "@/repositories/group-repository";
import { GroupMemberService } from "./group-member-service";
import { ExpenseService } from "./expense-service";
import { type DBType } from "@/db";

export class GroupService {
  private readonly groupRepository;
  private readonly groupMemberService;
  private readonly expenseService;
  private readonly db: DBType;

  constructor({
    groupRepository,
    groupMemberService,
    expenseService,
    db,
  }: {
    groupRepository: GroupRepository;
    groupMemberService: GroupMemberService;
    expenseService: ExpenseService;
    db: DBType;
  }) {
    this.groupRepository = groupRepository;
    this.groupMemberService = groupMemberService;
    this.expenseService = expenseService;
    this.db = db;
  }

  async getAllGroups(
    limit: number = 10,
    offset: number = 0
  ): Promise<GroupResponse[]> {
    return this.groupRepository.findAll(limit, offset);
  }

  async getGroupsByUser(
    userId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<GroupResponse[]> {
    const allGroups = await this.groupRepository.findAll(limit, offset);
    return allGroups.filter((group) => group.createdBy === userId);
  }

  async getGroupById(id: number): Promise<GroupResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    return this.groupRepository.findById(id);
  }

  async getGroupByIdAndUser(
    userId: number,
    groupId: number
  ): Promise<GroupResponse> {
    if (!groupId || typeof groupId !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new BadRequestError("Group not found");
    }

    if (group.createdBy !== userId) {
      throw new BadRequestError("Forbidden");
    }

    return group;
  }

  async createGroup(data: GroupCreate): Promise<GroupResponse> {
    return this.db.transaction(async (tx) => {
      try {
        // Create the group
        const group = await this.groupRepository.create(data, tx);

        // Add the creator as a member
        await this.groupMemberService.addGroupMember(
          {
            groupId: group.id,
            userId: data.createdBy,
          },
          tx
        );

        return group;
      } catch (error: any) {
        console.error("Failed to create group:", error);
        throw new BadRequestError("Failed to create group");
      }
    });
  }

  async updateGroup(
    id: number,
    data: GroupUpdate
  ): Promise<GroupResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    const existingGroup = await this.groupRepository.findById(id);
    if (!existingGroup) {
      return null;
    }

    return this.groupRepository.update(id, data);
  }

  async updateGroupByUser(
    userId: number,
    groupId: number,
    data: GroupUpdate
  ): Promise<GroupResponse | null> {
    await this.getGroupByIdAndUser(userId, groupId);
    return this.groupRepository.update(groupId, data);
  }

  async deleteGroup(id: number): Promise<boolean> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    const existingGroup = await this.groupRepository.findById(id);
    if (!existingGroup) {
      throw new BadRequestError("Group not found");
    }

    return this.groupRepository.delete(id);
  }

  async deleteGroupByUser(userId: number, groupId: number): Promise<boolean> {
    await this.getGroupByIdAndUser(userId, groupId);
    return this.groupRepository.delete(groupId);
  }

  async getGroupMembers(groupId: number) {
    return this.groupMemberService.getGroupMembers(groupId);
  }

  async getGroupMembersByUser(userId: number, groupId: number) {
    await this.getGroupByIdAndUser(userId, groupId);
    return this.groupMemberService.getGroupMembers(groupId);
  }

  async addGroupMember(groupId: number, userId: number) {
    return this.groupMemberService.addGroupMember({
      groupId,
      userId,
    });
  }

  async addGroupMemberByUser(
    ownerId: number,
    groupId: number,
    memberId: number
  ) {
    await this.getGroupByIdAndUser(ownerId, groupId);
    return this.groupMemberService.addGroupMember({
      groupId,
      userId: memberId,
    });
  }

  async removeGroupMember(groupId: number, userId: number) {
    return this.groupMemberService.removeGroupMember(groupId, userId);
  }

  async removeGroupMemberByUser(
    ownerId: number,
    groupId: number,
    memberId: number
  ) {
    await this.getGroupByIdAndUser(ownerId, groupId);
    return this.groupMemberService.removeGroupMember(groupId, memberId);
  }

  async getGroupBalances(groupId: number): Promise<GroupBalancesResponse> {
    if (!groupId || typeof groupId !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    // Validate that group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new BadRequestError("Group not found");
    }

    // Get all members of the group
    const members = await this.groupMemberService.getGroupMembers(groupId);

    // For now, return mock balances - in a real implementation,
    // you'd fetch expenses from the expense service
    const balances = this.calculateGroupBalances(members, []);

    return balances;
  }

  async getGroupBalancesByUser(
    userId: number,
    groupId: number
  ): Promise<GroupBalancesResponse> {
    await this.getGroupByIdAndUser(userId, groupId);
    return this.getGroupBalances(groupId);
  }

  async getSettlementPlan(groupId: number): Promise<SettlementPlanResponse> {
    if (!groupId || typeof groupId !== "number") {
      throw new BadRequestError("Invalid group ID");
    }

    // Validate that group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new BadRequestError("Group not found");
    }

    // Get balances
    const balances = await this.getGroupBalances(groupId);

    // Calculate settlement plan using debt simplification algorithm
    const settlementPlan = this.calculateSettlementPlan(balances);

    return settlementPlan;
  }

  async getSettlementPlanByUser(
    userId: number,
    groupId: number
  ): Promise<SettlementPlanResponse> {
    await this.getGroupByIdAndUser(userId, groupId);
    return this.getSettlementPlan(groupId);
  }

  private calculateGroupBalances(
    members: any[],
    expenses: any[]
  ): GroupBalancesResponse {
    // This is a simplified balance calculation
    // In a real implementation, you'd need to consider:
    // - Expense splits
    // - Payers vs payees
    // - Currency conversion
    // - Partial payments

    const memberBalances: {
      [key: string]: { balance: number; currency: string };
    } = {};

    // Initialize balances for all members
    members.forEach((member) => {
      memberBalances[member.userId] = { balance: 0, currency: "USD" }; // Default currency
    });

    // Calculate balances from expenses
    expenses.forEach((expense) => {
      const splitAmount = expense.amount / members.length; // Equal split for simplicity

      // The payer gets credit for the full amount
      if (memberBalances[expense.createdBy]) {
        memberBalances[expense.createdBy]!.balance += expense.amount;
      }

      // Each member owes their share
      members.forEach((member) => {
        if (
          member.userId !== expense.createdBy &&
          memberBalances[member.userId]
        ) {
          memberBalances[member.userId]!.balance -= splitAmount;
        }
      });
    });

    // Convert to response format
    return Object.entries(memberBalances).map(([userId, balance]) => ({
      userId: userId,
      name: `User ${userId}`, // In real implementation, get from user service
      balance: balance.balance,
      currency: balance.currency,
    }));
  }

  private calculateSettlementPlan(
    balances: GroupBalancesResponse
  ): SettlementPlanResponse {
    // Simplified settlement plan using the "greedy" algorithm
    // Sort balances: positive (creditors) first, then negative (debtors)
    const creditors = balances
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    const debtors = balances
      .filter((b) => b.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    const settlements: SettlementPlanResponse = [];

    let i = 0,
      j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      if (!creditor || !debtor) break;

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0.01) {
        // Avoid tiny settlements
        settlements.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.name,
          toUserId: creditor.userId,
          toUserName: creditor.name,
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
          currency: creditor.currency,
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance <= 0.01) i++;
      if (debtor.balance >= -0.01) j++;
    }

    return settlements;
  }
}
