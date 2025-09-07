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

  async getRecurringItemById(id: number): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    return this.recurringRepository.findById(id);
  }

  async createRecurringItem(data: RecurringCreate): Promise<RecurringResponse> {
    return this.recurringRepository.create(data);
  }

  async updateRecurringItem(
    id: number,
    data: RecurringUpdate
  ): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const existingItem = await this.recurringRepository.findById(id);
    if (!existingItem) {
      return null;
    }

    return this.recurringRepository.update(id, data);
  }

  async deleteRecurringItem(id: number): Promise<boolean> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const existingItem = await this.recurringRepository.findById(id);
    if (!existingItem) {
      throw new BadRequestError("Recurring item not found");
    }

    return this.recurringRepository.delete(id);
  }
}
