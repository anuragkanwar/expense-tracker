import { user } from "@/db";
import { eq } from "drizzle-orm";
import { UserResponse } from "@/models/user";
import { db as DATABASE } from "@/db";

export class UserRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findById(id: number): Promise<UserResponse | null> {
    const result = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id))
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

  async findByEmail(email: string): Promise<UserResponse | null> {
    const result = await this.db
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
