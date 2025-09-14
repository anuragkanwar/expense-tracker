import { type DBType, auth } from "@/db";
import type { UserCreate } from "@pocket-pixie/contracts";
import { TransactionAccountService } from "./transaction-account-service";

export class AuthService {
  private db: DBType;
  private readonly transactionAccountService;
  constructor({
    db,
    transactionAccountService,
  }: {
    db: DBType;
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
          Number(response.user.id),
          tx
        );
        return { headers, response };
      } catch (error: unknown) {
        // propagate for route-level handler
        tx.rollback();
        throw error;
      }
    });
  }
}
