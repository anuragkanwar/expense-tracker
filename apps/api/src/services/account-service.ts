import type {
  AccountResponse,
  AccountCreate,
  AccountUpdate,
} from "@/models/account";
import { BadRequestError } from "../errors/base-error";
import { AccountRepository } from "@/repositories/account-repository";

export class AccountService {
  private readonly accountRepository;

  constructor({ accountRepository }: { accountRepository: AccountRepository }) {
    this.accountRepository = accountRepository;
  }

  async getAllAccounts(
    limit: number = 10,
    offset: number = 0
  ): Promise<AccountResponse[]> {
    return this.accountRepository.findAll(limit, offset);
  }

  async getAccountById(id: string): Promise<AccountResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid account ID");
    }

    return this.accountRepository.findById(id);
  }

  async createAccount(data: AccountCreate): Promise<AccountResponse> {
    return this.accountRepository.create(data);
  }

  async updateAccount(
    id: string,
    data: AccountUpdate
  ): Promise<AccountResponse | null> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid account ID");
    }

    const existingAccount = await this.accountRepository.findById(id);
    if (!existingAccount) {
      return null;
    }

    return this.accountRepository.update(id, data);
  }

  async deleteAccount(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new BadRequestError("Invalid account ID");
    }

    const existingAccount = await this.accountRepository.findById(id);
    if (!existingAccount) {
      throw new BadRequestError("Account not found");
    }

    return this.accountRepository.delete(id);
  }
}
