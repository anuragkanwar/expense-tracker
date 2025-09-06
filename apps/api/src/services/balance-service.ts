import type {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@/models/user-balance";
import { BadRequestError } from "../errors/base-error";
import { BalanceRepository } from "@/repositories/balance-repository";

export class BalanceService {
  private readonly balanceRepository;

  constructor({ balanceRepository }: { balanceRepository: BalanceRepository }) {
    this.balanceRepository = balanceRepository;
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

  async createBalance(data: UserBalanceCreate): Promise<UserBalanceResponse> {
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
}
