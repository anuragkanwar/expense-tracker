import { UserRepository } from "@/repositories/user-repository";

export class UserService {
  private readonly userRepository;

  constructor({ userRepository }: { userRepository: UserRepository }) {
    this.userRepository = userRepository;
  }

  // TODO: Implement user service methods
}
