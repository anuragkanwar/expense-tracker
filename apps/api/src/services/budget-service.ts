import type {
  BudgetResponse,
  BudgetCreate,
  BudgetUpdate,
} from "@/models/budget";
import { BadRequestError } from "../errors/base-error";
import { BudgetRepository } from "@/repositories/budget-repository";

export class BudgetService {
  private readonly budgetRepository;

  constructor({ budgetRepository }: { budgetRepository: BudgetRepository }) {
    this.budgetRepository = budgetRepository;
  }

  async getAllBudgets(
    limit: number = 10,
    offset: number = 0
  ): Promise<BudgetResponse[]> {
    return this.budgetRepository.findAll(limit, offset);
  }

  async getBudgetById(id: string): Promise<BudgetResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid budget ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid budget ID format");
    }

    return this.budgetRepository.findById(numericId);
  }

  async createBudget(data: BudgetCreate): Promise<BudgetResponse> {
    return this.budgetRepository.create(data);
  }

  async updateBudget(
    id: string,
    data: BudgetUpdate
  ): Promise<BudgetResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid budget ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid budget ID format");
    }

    const existingBudget = await this.budgetRepository.findById(numericId);
    if (!existingBudget) {
      return null;
    }

    return this.budgetRepository.update(numericId, data);
  }

  async deleteBudget(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid budget ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid budget ID format");
    }

    const existingBudget = await this.budgetRepository.findById(numericId);
    if (!existingBudget) {
      throw new BadRequestError("Budget not found");
    }

    return this.budgetRepository.delete(numericId);
  }
}
