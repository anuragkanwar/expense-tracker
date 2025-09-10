import { ACCOUNT_TYPE, type DBType, type DBTransactionType } from "@/db";
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
  private db: DBType;
  constructor({
    transactionAccountRepository,
    friendService,
    db,
  }: {
    transactionAccountRepository: TransactionAccountRepository;
    friendService: FriendService;
    db: DBType;
  }) {
    this.transactionAccountRepository = transactionAccountRepository;
    this.friendService = friendService;
    this.db = db;
  }

  async seedInitialAccounts(userId: number, tx?: DBTransactionType) {
    if (tx) {
      // If tx is provided, use it directly without creating a new transaction
      for (const [name, type] of initialAccountSeed.entries()) {
        await this.transactionAccountRepository.create(
          {
            balance: 0,
            currency: "INR",
            isPaymentSource: type === ACCOUNT_TYPE.INCOME,
            name: name,
            type: type,
            userId: userId,
          },
          tx
        );
      }
    } else {
      // If no tx provided, create a new transaction
      await this.db.transaction(async (tx) => {
        for (const [name, type] of initialAccountSeed.entries()) {
          await this.transactionAccountRepository.create(
            {
              balance: 0,
              currency: "INR",
              isPaymentSource: type === ACCOUNT_TYPE.INCOME,
              name: name,
              type: type,
              userId: userId,
            },
            tx
          );
        }
      });
    }
  }

  async getAll(
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse[]> {
    return this.transactionAccountRepository.findByUserId(user.id, tx);
  }

  async getById(
    id: number,
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse> {
    const account =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        user.id,
        id,
        tx
      );
    if (!account) {
      throw new NotFoundError("Account not found");
    }
    return account;
  }

  async create(
    data: TransactionAccountCreate,
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse> {
    // Ensure the account belongs to the user
    const accountData = { ...data, userId: user.id };
    return this.transactionAccountRepository.create(accountData, tx);
  }

  async update(
    id: number,
    data: TransactionAccountUpdate,
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse> {
    // Check if account exists and belongs to user
    const existing =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        user.id,
        id,
        tx
      );
    if (!existing) {
      throw new NotFoundError("Account not found");
    }
    const updated = await this.transactionAccountRepository.update(
      id,
      data,
      tx
    );
    if (!updated) {
      throw new NotFoundError("Account not found");
    }
    return updated;
  }

  async delete(
    id: number,
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<void> {
    // Check if account exists and belongs to user
    const existing =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        user.id,
        id,
        tx
      );
    if (!existing) {
      throw new NotFoundError("Account not found");
    }
    const deleted = await this.transactionAccountRepository.delete(id, tx);
    if (!deleted) {
      throw new NotFoundError("Account not found");
    }
  }

  async getSpecialAccount(
    user: UserAuth,
    type: ACCOUNT_TYPE,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse | null> {
    return this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
      user.id,
      type,
      tx
    );
  }

  async getFriendsLoanAccounts(
    friendId: number,
    user: UserAuth,
    tx?: DBTransactionType
  ): Promise<TransactionAccountResponse[]> {
    const currentUserId = user.id;

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
        ACCOUNT_TYPE.LOAN_GIVEN,
        tx
      );
    const loanTaken =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        friendId,
        ACCOUNT_TYPE.LOAN_TAKEN,
        tx
      );
    const accounts = [];
    if (loanGiven) accounts.push(loanGiven);
    if (loanTaken) accounts.push(loanTaken);
    return accounts;
  }
}
