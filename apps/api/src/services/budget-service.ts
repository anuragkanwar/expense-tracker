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

  async getBudgetsByUser(
    userId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<BudgetResponse[]> {
    const allBudgets = await this.budgetRepository.findAll(limit, offset);
    return allBudgets.filter((budget) => budget.userId === userId);
  }

  async getBudgetById(id: number): Promise<BudgetResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid budget ID");
    }

    return this.budgetRepository.findById(id);
  }

  async getBudgetByIdAndUser(
    userId: number,
    budgetId: number
  ): Promise<BudgetResponse> {
    if (!budgetId || typeof budgetId !== "number") {
      throw new BadRequestError("Invalid budget ID");
    }

    const budget = await this.budgetRepository.findById(budgetId);
    if (!budget) {
      throw new BadRequestError("Budget not found");
    }

    if (budget.userId !== userId) {
      throw new BadRequestError("Forbidden");
    }

    return budget;
  }

  async createBudget(data: BudgetCreate): Promise<BudgetResponse> {
    return this.budgetRepository.create(data);
  }

  async updateBudget(
    id: number,
    data: BudgetUpdate
  ): Promise<BudgetResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid budget ID");
    }

    const existingBudget = await this.budgetRepository.findById(id);
    if (!existingBudget) {
      return null;
    }

    return this.budgetRepository.update(id, data);
  }

  async updateBudgetByUser(
    userId: number,
    budgetId: number,
    data: BudgetUpdate
  ): Promise<BudgetResponse | null> {
    await this.getBudgetByIdAndUser(userId, budgetId);
    return this.budgetRepository.update(budgetId, data);
  }

  async deleteBudget(id: number): Promise<boolean> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid budget ID");
    }

    const existingBudget = await this.budgetRepository.findById(id);
    if (!existingBudget) {
      throw new BadRequestError("Budget not found");
    }

    return this.budgetRepository.delete(id);
  }

  async deleteBudgetByUser(userId: number, budgetId: number): Promise<boolean> {
    await this.getBudgetByIdAndUser(userId, budgetId);
    return this.budgetRepository.delete(budgetId);
  }
}
