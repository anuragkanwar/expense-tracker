import { GroupRepository } from "@/repositories/group-repository";

export class GroupService {
  private readonly groupRepository;

  constructor({ groupRepository }: { groupRepository: GroupRepository }) {
    this.groupRepository = groupRepository;
  }

  // TODO: Implement group service methods
}
