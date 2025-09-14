import { settlementApplication } from "@/db";
import { eq } from "drizzle-orm";
import { type DBType, type DBTransactionType } from "@/db";

export interface SettlementApplicationCreate {
  settlementId: number;
  expenseShareId: number;
  appliedAmount: number;
}

export interface SettlementApplicationResponse {
  id: number;
  settlementId: number;
  expenseShareId: number;
  appliedAmount: number;
  createdAt: string; // ISO string
}

export class SettlementApplicationRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  private map(
    row: typeof settlementApplication.$inferSelect
  ): SettlementApplicationResponse {
    return {
      id: row.id,
      settlementId: row.settlementId,
      expenseShareId: row.expenseShareId,
      appliedAmount: row.appliedAmount,
      createdAt: row.createdAt.toISOString(),
    } as SettlementApplicationResponse;
  }

  async create(
    data: SettlementApplicationCreate,
    tx?: DBTransactionType
  ): Promise<SettlementApplicationResponse> {
    const db = tx ?? this.db;
    const rows = await db
      .insert(settlementApplication)
      .values({ ...data, createdAt: new Date() })
      .returning();
    if (!rows.length || !rows[0]) {
      throw new Error("Failed to create settlement application");
    }
    return this.map(rows[0]);
  }

  async createMany(
    data: SettlementApplicationCreate[],
    tx?: DBTransactionType
  ): Promise<SettlementApplicationResponse[]> {
    if (!data.length) return [];
    const db = tx ?? this.db;
    const rows = await db
      .insert(settlementApplication)
      .values(data.map((d) => ({ ...d, createdAt: new Date() })))
      .returning();
    return rows.map((r) => this.map(r));
  }

  async findBySettlementId(
    settlementId: number,
    tx?: DBTransactionType
  ): Promise<SettlementApplicationResponse[]> {
    const db = tx ?? this.db;
    const rows = await db
      .select()
      .from(settlementApplication)
      .where(eq(settlementApplication.settlementId, settlementId));
    return rows.map((r) => this.map(r));
  }

  async findByExpenseShareId(
    expenseShareId: number,
    tx?: DBTransactionType
  ): Promise<SettlementApplicationResponse[]> {
    const db = tx ?? this.db;
    const rows = await db
      .select()
      .from(settlementApplication)
      .where(eq(settlementApplication.expenseShareId, expenseShareId));
    return rows.map((r) => this.map(r));
  }
}
