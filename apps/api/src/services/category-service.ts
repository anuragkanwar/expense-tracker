import type {
  TransactionCategoryResponse,
  TransactionCategoryCreate,
  TransactionCategoryUpdate,
} from "@/models/transaction-category";
import { BadRequestError } from "../errors/base-error";
import { CategoryRepository } from "@/repositories/category-repository";

export class CategoryService {
  private readonly categoryRepository;

  constructor({
    categoryRepository,
  }: {
    categoryRepository: CategoryRepository;
  }) {
    this.categoryRepository = categoryRepository;
  }

  async getAllCategories(
    limit: number = 10,
    offset: number = 0
  ): Promise<TransactionCategoryResponse[]> {
    return this.categoryRepository.findAll(limit, offset);
  }

  async getCategoryById(
    id: string
  ): Promise<TransactionCategoryResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid category ID format");
    }

    return this.categoryRepository.findById(numericId);
  }

  async createCategory(
    data: TransactionCategoryCreate
  ): Promise<TransactionCategoryResponse> {
    return this.categoryRepository.create(data);
  }

  async updateCategory(
    id: string,
    data: TransactionCategoryUpdate
  ): Promise<TransactionCategoryResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid category ID format");
    }

    const existingCategory = await this.categoryRepository.findById(numericId);
    if (!existingCategory) {
      return null;
    }

    return this.categoryRepository.update(numericId, data);
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestError("Invalid category ID format");
    }

    const existingCategory = await this.categoryRepository.findById(numericId);
    if (!existingCategory) {
      throw new BadRequestError("Category not found");
    }

    return this.categoryRepository.delete(numericId);
  }
}
