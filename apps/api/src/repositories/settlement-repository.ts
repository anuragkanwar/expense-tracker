import { settlement } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
} from "@/models/settlement";
import { type DBType, type DBTransactionType } from "@/db";

export class SettlementRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<SettlementResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(settlement)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      settledAt: row.settledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as SettlementResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<SettlementResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(settlement)
      .where(eq(settlement.id, id))
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
      settledAt: row.settledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as SettlementResponse;
  }

  async findByGroupId(
    groupId: number,
    tx?: DBTransactionType
  ): Promise<SettlementResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(settlement)
      .where(eq(settlement.groupId, groupId));
    return result.map((row) => ({
      ...row,
      settledAt: row.settledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as SettlementResponse[];
  }

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<SettlementResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(settlement)
      .where(
        and(eq(settlement.payerId, userId), eq(settlement.payeeId, userId))
      );
    return result.map((row) => ({
      ...row,
      settledAt: row.settledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as SettlementResponse[];
  }

  async findByIdempotencyKey(
    key: string,
    tx?: DBTransactionType
  ): Promise<SettlementResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(settlement)
      .where(eq(settlement.idempotencyKey, key))
      .limit(1);
    if (!result.length || !result[0]) return null;
    const row = result[0];
    return {
      ...row,
      settledAt: row.settledAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as SettlementResponse;
  }

  async create(
    data: SettlementCreate,
    tx?: DBTransactionType
  ): Promise<SettlementResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(settlement)
      .values({
        ...data,
        settledAt: data.settledAt ? new Date(data.settledAt) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: settlement.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create settlement");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create settlement");
    }

    return created;
  }

  async update(
    id: number,
    data: SettlementUpdate,
    tx?: DBTransactionType
  ): Promise<SettlementResponse | null> {
    const db = tx ?? this.db;
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.settledAt) {
      updateData.settledAt = new Date(data.settledAt);
    }

    await db.update(settlement).set(updateData).where(eq(settlement.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(settlement).where(eq(settlement.id, id));

    return result.rowsAffected > 0;
  }
}
