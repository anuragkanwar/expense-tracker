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

    return this.categoryRepository.findById(id);
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

    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      return null;
    }

    return this.categoryRepository.update(id, data);
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid category ID");
    }

    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new BadRequestError("Category not found");
    }

    return this.categoryRepository.delete(id);
  }
}
