import { account } from "@/db";
import { eq } from "drizzle-orm";
import {
  AccountResponse,
  AccountCreate,
  AccountUpdate,
} from "@/models/account";
import { type DBType, type DBTransactionType } from "@/db";

export class AccountRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<AccountResponse[]> {
    const db = tx ?? this.db;
    const result = await db.select().from(account).limit(limit).offset(offset);
    return result as AccountResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<AccountResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(account)
      .where(eq(account.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    return result[0] as AccountResponse;
  }

  async create(
    data: AccountCreate,
    tx?: DBTransactionType
  ): Promise<AccountResponse> {
    const db = tx ?? this.db;
    const result = await db
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
    data: AccountUpdate,
    tx?: DBTransactionType
  ): Promise<AccountResponse | null> {
    const db = tx ?? this.db;
    await db.update(account).set(data).where(eq(account.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(account).where(eq(account.id, id));

    return result.rowsAffected > 0;
  }
}
