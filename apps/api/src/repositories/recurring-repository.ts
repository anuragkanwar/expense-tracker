import { recurring } from "@/db";
import { eq } from "drizzle-orm";
import type {
  RecurringResponse,
  RecurringCreate,
  RecurringUpdate,
} from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";

export class RecurringRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<RecurringResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurring)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      nextDate: row.nextDate?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<RecurringResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurring)
      .where(eq(recurring.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      nextDate: row.nextDate?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<RecurringResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurring)
      .where(eq(recurring.userId, userId));
    return result.map((row) => ({
      ...row,
      nextDate: row.nextDate?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async create(
    data: RecurringCreate,
    tx?: DBTransactionType
  ): Promise<RecurringResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
    };

    const result = await db.insert(recurring).values(insertData).returning();

    if (result.length === 0) {
      throw new Error("Failed to create recurring item");
    }

    const item = result[0]!;
    return {
      ...item,
      nextDate: item.nextDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async update(
    id: number,
    data: RecurringUpdate,
    tx?: DBTransactionType
  ): Promise<RecurringResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
    };

    await db.update(recurring).set(updateData).where(eq(recurring.id, id));

    return await this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(recurring).where(eq(recurring.id, id));

    return result.rowsAffected > 0;
  }
}
