import { ACCOUNT_TYPE, db as DATABASE } from "@/db";
import { initialAccountSeed } from "@/utils/constants";
import { TransactionAccountRepository } from "@/repositories";
export class TransactionAccountService {
  private readonly transactionAccountRepository;
  private db: typeof DATABASE;
  constructor({
    transactionAccountRepository,
    db,
  }: {
    transactionAccountRepository: TransactionAccountRepository;
    db: typeof DATABASE;
  }) {
    this.transactionAccountRepository = transactionAccountRepository;
    this.db = db;
  }

  async seedInitialAccounts(userId: number) {
    await this.db.transaction(async (tx) => {
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
}
