import { db as DATABASE, auth } from "@/db";
import { UserCreate } from "@/models";
import { TransactionAccountService } from "./transaction-account-service";

export class AuthService {
  private db: typeof DATABASE;
  private readonly transactionAccountService;
  constructor({
    db,
    transactionAccountService,
  }: {
    db: typeof DATABASE;
    transactionAccountService: TransactionAccountService;
  }) {
    this.db = db;
    this.transactionAccountService = transactionAccountService;
  }

  async signUp(userCreate: UserCreate) {
    return await this.db.transaction(async (tx) => {
      try {
        const { headers, response } = await auth.api.signUpEmail({
          returnHeaders: true,
          body: {
            email: userCreate.email,
            password: userCreate.password,
            name: userCreate.name,
          },
        });
        await this.transactionAccountService.seedInitialAccounts(
          parseInt(response.user.id)
        );
        return { headers, response };
      } catch (error: any) {
        tx.rollback();
        throw error;
      }
    });
  }
}
