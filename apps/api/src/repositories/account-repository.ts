import { account } from "@/db";
import { eq } from "drizzle-orm";
import {
  AccountResponse,
  AccountCreate,
  AccountUpdate,
} from "@/models/account";
import { db as DATABASE } from "@/db";

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

  async findById(id: number): Promise<AccountResponse | null> {
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
    const result = await this.db
      .insert(account)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to create account");
    }

    return result[0] as AccountResponse;
  }

  async update(
    id: number,
    data: AccountUpdate
  ): Promise<AccountResponse | null> {
    await this.db.update(account).set(data).where(eq(account.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(account).where(eq(account.id, id));

    return result.rowsAffected > 0;
  }
}
