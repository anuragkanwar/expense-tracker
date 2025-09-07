import { ACCOUNT_TYPE, db as DATABASE } from "@/db";
import { initialAccountSeed } from "@/utils/constants";
import { TransactionAccountRepository } from "@/repositories";
import {
  TransactionAccountCreate,
  TransactionAccountUpdate,
  TransactionAccountResponse,
} from "@/models/transaction-account";
import { UserAuth } from "@/models/auth";
import { NotFoundError, ValidationError } from "@/errors/base-error";
import { FriendService } from "./friend-service";

export class TransactionAccountService {
  private readonly transactionAccountRepository;
  private readonly friendService;
  private db: typeof DATABASE;
  constructor({
    transactionAccountRepository,
    friendService,
    db,
  }: {
    transactionAccountRepository: TransactionAccountRepository;
    friendService: FriendService;
    db: typeof DATABASE;
  }) {
    this.transactionAccountRepository = transactionAccountRepository;
    this.friendService = friendService;
    this.db = db;
  }

  async seedInitialAccounts(userId: number) {
    await this.db.transaction(async () => {
      for (const [name, type] of initialAccountSeed.entries()) {
        await this.transactionAccountRepository.create({
          balance: 0,
          currency: "INR",
          isPaymentSource: type === ACCOUNT_TYPE.INCOME,
          name: name,
          type: type,
          userId: userId,
        });
      }
    });
  }

  async getAll(user: UserAuth): Promise<TransactionAccountResponse[]> {
    return this.transactionAccountRepository.findByUserId(Number(user.id));
  }

  async getById(
    id: number,
    user: UserAuth
  ): Promise<TransactionAccountResponse> {
    const account =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        Number(user.id),
        id
      );
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    return account;
  }

  async create(
    data: TransactionAccountCreate,
    user: UserAuth
  ): Promise<TransactionAccountResponse> {
    // Ensure the account belongs to the user
    const accountData = { ...data, userId: Number(user.id) };
    return this.transactionAccountRepository.create(accountData);
  }

  async update(
    id: number,
    data: TransactionAccountUpdate,
    user: UserAuth
  ): Promise<TransactionAccountResponse> {
    // Check if account exists and belongs to user
    const existing =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        Number(user.id),
        id
      );
    if (!existing) {
      throw new NotFoundError("Account not found");
    }
    const updated = await this.transactionAccountRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError("Account not found");
    }
    return updated;
  }

  async delete(id: number, user: UserAuth): Promise<void> {
    // Check if account exists and belongs to user
    const existing =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        Number(user.id),
        id
      );
    if (!existing) {
      throw new NotFoundError("Account not found");
    }
    const deleted = await this.transactionAccountRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Account not found");
    }
  }

  async getSpecialAccount(
    user: UserAuth,
    type: ACCOUNT_TYPE
  ): Promise<TransactionAccountResponse | null> {
    return this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
      user.id,
      type
    );
  }

  async getFriendsLoanAccounts(
    friendId: number,
    user: UserAuth
  ): Promise<TransactionAccountResponse[]> {
    const currentUserId = Number(user.id);

    // Check if they are friends
    const areFriends = await this.friendService.areFriends(
      currentUserId,
      friendId
    );
    if (!areFriends) {
      throw new ValidationError(
        "You can only view loan accounts of your friends"
      );
    }

    const loanGiven =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        friendId,
        ACCOUNT_TYPE.LOAN_GIVEN
      );
    const loanTaken =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        friendId,
        ACCOUNT_TYPE.LOAN_TAKEN
      );
    const accounts = [];
    if (loanGiven) accounts.push(loanGiven);
    if (loanTaken) accounts.push(loanTaken);
    return accounts;
  }
}
