import { recurring } from "@/db";
import { eq } from "drizzle-orm";
import {
  RecurringResponse,
  RecurringCreate,
  RecurringUpdate,
} from "@/models/recurring";
import { db as DATABASE } from "@/db";

export class RecurringRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<RecurringResponse[]> {
    const result = await this.db
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

  async findById(id: number): Promise<RecurringResponse | null> {
    const result = await this.db
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

  async findByUserId(userId: number): Promise<RecurringResponse[]> {
    const result = await this.db
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

  async create(data: RecurringCreate): Promise<RecurringResponse> {
    const insertData = {
      ...data,
      nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
    };

    const result = await this.db
      .insert(recurring)
      .values(insertData as any)
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to create recurring item");
    }

    const item = result[0]!;
    return {
      ...item,
      nextDate: item.nextDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as any;
  }

  async update(
    id: number,
    data: RecurringUpdate
  ): Promise<RecurringResponse | null> {
    const updateData = {
      ...data,
      nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
    };

    await this.db.update(recurring).set(updateData).where(eq(recurring.id, id));

    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(recurring).where(eq(recurring.id, id));

    return result.rowsAffected > 0;
  }
}
