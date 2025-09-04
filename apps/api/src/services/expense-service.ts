import { ExpenseRepository } from "@/repositories/expense-repository";

export class ExpenseService {
  private readonly expenseRepository;

  constructor({ expenseRepository }: { expenseRepository: ExpenseRepository }) {
    this.expenseRepository = expenseRepository;
  }

  // TODO: Implement expense service methods
}
