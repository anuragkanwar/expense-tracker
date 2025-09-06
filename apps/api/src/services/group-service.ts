import type { GroupResponse, GroupCreate, GroupUpdate } from "@/models/group";
import type {
  GroupBalancesResponse,
  SettlementPlanResponse,
} from "@/dto/groups.dto";
import { BadRequestError } from "../errors/base-error";
import { GroupRepository } from "@/repositories/group-repository";
import { GroupMemberService } from "./group-member-service";
import { ExpenseService } from "./expense-service";

export class GroupService {
  private readonly groupRepository;
  private readonly groupMemberService;
  private readonly expenseService;

  constructor({
    groupRepository,
    groupMemberService,
    expenseService,
  }: {
    groupRepository: GroupRepository;
    groupMemberService: GroupMemberService;
    expenseService: ExpenseService;
  }) {
    this.groupRepository = groupRepository;
    this.groupMemberService = groupMemberService;
    this.expenseService = expenseService;
  }

  async getAllGroups(
    limit: number = 10,
    offset: number = 0
  ): Promise<GroupResponse[]> {
    return this.groupRepository.findAll(limit, offset);
  }

  async getGroupById(id: string): Promise<GroupResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    return this.groupRepository.findById(numericId);
  }

  async createGroup(data: GroupCreate): Promise<GroupResponse> {
    return this.groupRepository.create(data);
  }

  async updateGroup(
    id: string,
    data: GroupUpdate
  ): Promise<GroupResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    const existingGroup = await this.groupRepository.findById(numericId);
    if (!existingGroup) {
      return null;
    }

    return this.groupRepository.update(numericId, data);
  }

  async deleteGroup(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    const existingGroup = await this.groupRepository.findById(numericId);
    if (!existingGroup) {
      throw new BadRequestError("Group not found");
    }

    return this.groupRepository.delete(numericId);
  }

  async getGroupMembers(groupId: string) {
    return this.groupMemberService.getGroupMembers(groupId);
  }

  async addGroupMember(groupId: string, userId: number) {
    return this.groupMemberService.addGroupMember({
      groupId: parseInt(groupId),
      userId,
    });
  }

  async removeGroupMember(groupId: string, userId: string) {
    return this.groupMemberService.removeGroupMember(groupId, userId);
  }

  async getGroupBalances(groupId: string): Promise<GroupBalancesResponse> {
    if (!groupId || typeof groupId !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericGroupId = parseInt(groupId, 10);
    if (isNaN(numericGroupId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    // Validate that group exists
    const group = await this.groupRepository.findById(numericGroupId);
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

  async getSettlementPlan(groupId: string): Promise<SettlementPlanResponse> {
    if (!groupId || typeof groupId !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericGroupId = parseInt(groupId, 10);
    if (isNaN(numericGroupId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    // Validate that group exists
    const group = await this.groupRepository.findById(numericGroupId);
    if (!group) {
      throw new BadRequestError("Group not found");
    }

    // Get balances
    const balances = await this.getGroupBalances(groupId);

    // Calculate settlement plan using debt simplification algorithm
    const settlementPlan = this.calculateSettlementPlan(balances);

    return settlementPlan;
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
      [key: number]: { balance: number; currency: string };
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
      userId: parseInt(userId),
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
