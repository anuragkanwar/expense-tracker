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

    return this.budgetRepository.findById(id);
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

    const existingBudget = await this.budgetRepository.findById(id);
    if (!existingBudget) {
      return null;
    }

    return this.budgetRepository.update(id, data);
  }

  async deleteBudget(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid budget ID");
    }

    const existingBudget = await this.budgetRepository.findById(id);
    if (!existingBudget) {
      throw new BadRequestError("Budget not found");
    }

    return this.budgetRepository.delete(id);
  }
}
