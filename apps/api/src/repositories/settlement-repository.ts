import { settlement } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  SettlementResponse,
  SettlementCreate,
  SettlementUpdate,
} from "@/models/settlement";
import { db as DATABASE } from "@/db";

export class SettlementRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0
  ): Promise<SettlementResponse[]> {
    const result = await this.db
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

  async findById(id: number): Promise<SettlementResponse | null> {
    const result = await this.db
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

  async findByGroupId(groupId: number): Promise<SettlementResponse[]> {
    const result = await this.db
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

  async findByUserId(userId: number): Promise<SettlementResponse[]> {
    const result = await this.db
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

  async create(data: SettlementCreate): Promise<SettlementResponse> {
    const result = await this.db
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

    const created = await this.findById(result[0].id);
    if (!created) {
      throw new Error("Failed to create settlement");
    }

    return created;
  }

  async update(
    id: number,
    data: SettlementUpdate
  ): Promise<SettlementResponse | null> {
    const updateData: any = { ...data };
    if (data.settledAt) {
      updateData.settledAt = new Date(data.settledAt);
    }
    updateData.updatedAt = new Date();

    await this.db
      .update(settlement)
      .set(updateData)
      .where(eq(settlement.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(settlement)
      .where(eq(settlement.id, id));

    return result.rowsAffected > 0;
  }
}
