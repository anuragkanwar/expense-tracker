import type {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
} from "@/models/settlement";
import { BadRequestError } from "../errors/base-error";
import { SettlementRepository } from "@/repositories/settlement-repository";

export class SettlementService {
  private readonly settlementRepository;

  constructor({
    settlementRepository,
  }: {
    settlementRepository: SettlementRepository;
  }) {
    this.settlementRepository = settlementRepository;
  }

  async getAllSettlements(
    limit: number = 10,
    offset: number = 0
  ): Promise<SettlementResponse[]> {
    return this.settlementRepository.findAll(limit, offset);
  }

  async getSettlementById(id: string): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    return this.settlementRepository.findById(numericId);
  }

  async getSettlementsByGroupId(
    groupId: string
  ): Promise<SettlementResponse[]> {
    if (!groupId || typeof groupId !== "string") {
      throw new BadRequestError("Invalid group ID");
    }

    const numericGroupId = parseInt(groupId, 10);
    if (isNaN(numericGroupId)) {
      throw new BadRequestError("Invalid group ID format");
    }

    return this.settlementRepository.findByGroupId(numericGroupId);
  }

  async createSettlement(data: SettlementCreate): Promise<SettlementResponse> {
    // Validate that payer and payee are different
    if (data.payerId === data.payeeId) {
      throw new BadRequestError("Payer and payee cannot be the same user");
    }

    // Validate amount is positive
    if (data.amount <= 0) {
      throw new BadRequestError("Settlement amount must be positive");
    }

    return this.settlementRepository.create(data);
  }

  async updateSettlement(
    id: string,
    data: SettlementUpdate
  ): Promise<SettlementResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      return null;
    }

    return this.settlementRepository.update(numericId, data);
  }

  async deleteSettlement(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid settlement ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid settlement ID format");
    }

    const existingSettlement =
      await this.settlementRepository.findById(numericId);
    if (!existingSettlement) {
      throw new BadRequestError("Settlement not found");
    }

    return this.settlementRepository.delete(numericId);
  }
}
