import { account } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import {
  AccountResponse,
  AccountCreate,
  AccountUpdate,
} from "@/models/account";
import { db as DATABASE } from "@pocket-pixie/db";

export class AccountRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<AccountResponse[]> {
    const result = await this.db
      .select()
      .from(account)
      .limit(limit)
      .offset(offset);
    return result as AccountResponse[];
  }

  async findById(id: string): Promise<AccountResponse | null> {
    const result = await this.db
      .select()
      .from(account)
      .where(eq(account.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    return result[0] as AccountResponse;
  }

  async create(data: AccountCreate): Promise<AccountResponse> {
    const id = crypto.randomUUID();

    await this.db.insert(account).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    });

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to create account");
    }

    return created;
  }

  async update(
    id: string,
    data: AccountUpdate
  ): Promise<AccountResponse | null> {
    await this.db.update(account).set(data).where(eq(account.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(account).where(eq(account.id, id));

    return result.rowsAffected > 0;
  }
}
