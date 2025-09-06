import type {
  RecurringResponse,
  RecurringCreate,
  RecurringUpdate,
} from "@/models/recurring";
import { BadRequestError } from "../errors/base-error";
import { RecurringRepository } from "@/repositories/recurring-repository";

export class RecurringService {
  private readonly recurringRepository;

  constructor({
    recurringRepository,
  }: {
    recurringRepository: RecurringRepository;
  }) {
    this.recurringRepository = recurringRepository;
  }

  async getAllRecurringItems(
    limit: number = 10,
    offset: number = 0
  ): Promise<RecurringResponse[]> {
    return this.recurringRepository.findAll(limit, offset);
  }

  async getRecurringItemById(id: string): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid recurring item ID format");
    }

    return this.recurringRepository.findById(numericId);
  }

  async createRecurringItem(data: RecurringCreate): Promise<RecurringResponse> {
    return this.recurringRepository.create(data);
  }

  async updateRecurringItem(
    id: string,
    data: RecurringUpdate
  ): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid recurring item ID format");
    }

    const existingItem = await this.recurringRepository.findById(numericId);
    if (!existingItem) {
      return null;
    }

    return this.recurringRepository.update(numericId, data);
  }

  async deleteRecurringItem(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid recurring item ID format");
    }

    const existingItem = await this.recurringRepository.findById(numericId);
    if (!existingItem) {
      throw new BadRequestError("Recurring item not found");
    }

    return this.recurringRepository.delete(numericId);
  }
}
