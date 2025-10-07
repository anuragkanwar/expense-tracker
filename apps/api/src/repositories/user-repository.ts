import { user } from "@/db";
import { eq } from "drizzle-orm";
import type { UserResponse } from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";

export class UserRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<UserResponse | null> {
    const db = tx ?? this.db;
    const result = await db.select().from(user).where(eq(user.id, id)).limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as UserResponse;
  }

  async findByEmail(
    email: string,
    tx?: DBTransactionType
  ): Promise<UserResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as UserResponse;
  }
}
