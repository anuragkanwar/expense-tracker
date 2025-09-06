import type {
  GroupMemberResponse,
  GroupMemberCreate,
} from "@/models/group-member";
import { BadRequestError, NotFoundError } from "../errors/base-error";
import { GroupMemberRepository } from "@/repositories/group-member-repository";
import { GroupRepository } from "@/repositories/group-repository";

export class GroupMemberService {
  private readonly groupMemberRepository;
  private readonly groupRepository;

  constructor({
    groupMemberRepository,
    groupRepository,
  }: {
    groupMemberRepository: GroupMemberRepository;
    groupRepository: GroupRepository;
  }) {
    this.groupMemberRepository = groupMemberRepository;
    this.groupRepository = groupRepository;
  }

  async getAllGroupMembers(
    limit: number = 10,
    offset: number = 0
  ): Promise<GroupMemberResponse[]> {
    return this.groupMemberRepository.findAll(limit, offset);
  }

  async getGroupMemberById(id: string): Promise<GroupMemberResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid group member ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid group member ID format");
    }

    return this.groupMemberRepository.findById(numericId);
  }

  async getGroupMembers(groupId: string): Promise<GroupMemberResponse[]> {
    if (!groupId || typeof groupId !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericGroupId = parseInt(groupId, 10);
    if (isNaN(numericGroupId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    return this.groupMemberRepository.findByGroupId(numericGroupId);
  }

  async addGroupMember(data: GroupMemberCreate): Promise<GroupMemberResponse> {
    // Validate that group exists
    const group = await this.groupRepository.findById(data.groupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is already a member
    const existingMembers = await this.groupMemberRepository.findByGroupId(
      data.groupId
    );
    const isAlreadyMember = existingMembers.some(
      (member) => member.userId === data.userId
    );
    if (isAlreadyMember) {
      throw new BadRequestError("User is already a member of this group");
    }

    return this.groupMemberRepository.create(data);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    if (!groupId || typeof groupId !== "string") {
      throw new BadRequestError("Invalid group ID");
    }
    if (!userId || typeof userId !== "string") {
      throw new BadRequestError("Invalid user ID");
    }

    const numericGroupId = parseInt(groupId, 10);
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericGroupId)) {
      throw new BadRequestError("Invalid group ID format");
    }
    if (isNaN(numericUserId)) {
      throw new BadRequestError("Invalid user ID format");
    }

    // Validate that group exists
    const group = await this.groupRepository.findById(numericGroupId);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    // Check if user is a member
    const members =
      await this.groupMemberRepository.findByGroupId(numericGroupId);
    const isMember = members.some((member) => member.userId === numericUserId);
    if (!isMember) {
      throw new NotFoundError("User is not a member of this group");
    }

    return this.groupMemberRepository.deleteByGroupIdAndUserId(
      numericGroupId,
      numericUserId
    );
  }

  async isUserMemberOfGroup(groupId: number, userId: number): Promise<boolean> {
    const members = await this.groupMemberRepository.findByGroupId(groupId);
    return members.some((member) => member.userId === userId);
  }

  async getUserGroups(userId: string): Promise<GroupMemberResponse[]> {
    if (!userId || typeof userId !== "string") {
      throw new BadRequestError("Invalid user ID");
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new BadRequestError("Invalid user ID format");
    }

    return this.groupMemberRepository.findByUserId(numericUserId);
  }
}
