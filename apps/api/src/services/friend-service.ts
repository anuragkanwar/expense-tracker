import { FriendRepository } from "@/repositories/friend-repository";

export class FriendService {
  private readonly friendRepository;

  constructor({ friendRepository }: { friendRepository: FriendRepository }) {
    this.friendRepository = friendRepository;
  }

  // TODO: Implement friend service methods
}
