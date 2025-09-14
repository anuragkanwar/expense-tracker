import { expenseShare } from "@/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import { type DBType, type DBTransactionType } from "@/db";
import { EXPENSE_SHARE_STATUS, SHARE_TYPE, SPLIT_TYPE } from "@/db";

export interface ExpenseShareCreate {
  transactionId: number;
  payerUserId: number;
  participantUserId: number;
  groupId?: number | null;
  shareType?: SHARE_TYPE | null;
  splitType?: SPLIT_TYPE | null;
  expenseAccountId?: number | null;
  currency: string;
  amount: number;
  paidAmount?: number;
  status?: EXPENSE_SHARE_STATUS;
  realizedAt?: Date | null;
  isPayerShare?: number; // 1 or 0
  metadata?: any;
}

export interface ExpenseShareUpdate {
  paidAmount?: number;
  status?: EXPENSE_SHARE_STATUS;
  metadata?: any;
}

export interface ExpenseShareResponse {
  id: number;
  transactionId: number;
  payerUserId: number;
  participantUserId: number;
  groupId?: number | null;
  shareType?: SHARE_TYPE | null;
  splitType?: SPLIT_TYPE | null;
  expenseAccountId?: number | null;
  currency: string;
  amount: number;
  paidAmount: number;
  status: EXPENSE_SHARE_STATUS;
  realizedAt?: string | null;
  isPayerShare: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export class ExpenseShareRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  private map(row: any): ExpenseShareResponse {
    return {
      ...row,
      realizedAt: row.realizedAt ? row.realizedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as ExpenseShareResponse;
  }

  async createMany(
    data: ExpenseShareCreate[],
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse[]> {
    if (!data.length) return [];
    const db = tx ?? this.db;
    const rows = await db
      .insert(expenseShare)
      .values(
        data.map((d) => ({
          ...d,
          paidAmount: d.paidAmount ?? 0,
          status: d.status ?? EXPENSE_SHARE_STATUS.UNPAID,
          realizedAt: d.realizedAt ?? new Date(),
          isPayerShare: d.isPayerShare ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .returning();
    return rows.map((r) => this.map(r));
  }

  async findById(id: number, tx?: DBTransactionType) {
    const db = tx ?? this.db;
    const rows = await db
      .select()
      .from(expenseShare)
      .where(eq(expenseShare.id, id))
      .limit(1);
    if (!rows.length) return null;
    return this.map(rows[0]);
  }

  async findAllocatableShares(
    participantUserId: number,
    payerUserId: number,
    currency: string,
    groupId?: number | null,
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse[]> {
    const db = tx ?? this.db;
    const conditions: any[] = [
      eq(expenseShare.participantUserId, participantUserId),
      eq(expenseShare.payerUserId, payerUserId),
      eq(expenseShare.currency, currency),
      eq(expenseShare.isPayerShare, 0),
      inArray(expenseShare.status, [
        EXPENSE_SHARE_STATUS.UNPAID,
        EXPENSE_SHARE_STATUS.PARTIALLY_PAID,
      ]),
    ];
    if (groupId !== undefined) {
      // groupId can be null (non-group expense) or number; drizzle eq for nullable column expects matching type.
      conditions.push(eq(expenseShare.groupId as any, groupId as any));
    }
    const rows = await db
      .select()
      .from(expenseShare)
      .where(and(...conditions))
      .orderBy(asc(expenseShare.createdAt), asc(expenseShare.id));
    return rows.map((r) => this.map(r));
  }

  async update(
    id: number,
    data: ExpenseShareUpdate,
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(expenseShare)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(expenseShare.id, id));
    return this.findById(id, tx);
  }

  async updateSharePayment(
    id: number,
    paidAmount: number,
    status: EXPENSE_SHARE_STATUS,
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse | null> {
    return this.update(id, { paidAmount, status }, tx);
  }

  async listByUser(
    userId: number,
    filters: {
      status?: EXPENSE_SHARE_STATUS;
      isPayer?: boolean;
      limit?: number;
      offset?: number;
    } = {},
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse[]> {
    const db = tx ?? this.db;
    const conditions: any[] = [];

    if (filters.isPayer === true) {
      conditions.push(eq(expenseShare.payerUserId, userId));
    } else if (filters.isPayer === false) {
      conditions.push(eq(expenseShare.participantUserId, userId));
    } else {
      // either role
      // (participantUserId = userId OR payerUserId = userId)
      // Drizzle doesn't have direct OR helper with different columns; use and() with eq(1,1) circumvent? We'll just fetch both separately for simplicity
      const payerRowsPromise = db
        .select()
        .from(expenseShare)
        .where(eq(expenseShare.payerUserId, userId))
        .limit(filters.limit ?? 50)
        .offset(filters.offset ?? 0);
      const participantRowsPromise = db
        .select()
        .from(expenseShare)
        .where(eq(expenseShare.participantUserId, userId))
        .limit(filters.limit ?? 50)
        .offset(filters.offset ?? 0);
      const [payerRows, participantRows] = await Promise.all([
        payerRowsPromise,
        participantRowsPromise,
      ]);
      let combined = [...payerRows, ...participantRows];
      if (filters.status) {
        combined = combined.filter((r) => r.status === filters.status);
      }
      // dedupe by id
      const map = new Map<number, any>();
      for (const r of combined) {
        map.set(r.id, r);
      }
      return Array.from(map.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((r) => this.map(r));
    }

    if (filters.status) {
      conditions.push(eq(expenseShare.status, filters.status));
    }

    const rows = await db
      .select()
      .from(expenseShare)
      .where(and(...conditions))
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0)
      .orderBy(asc(expenseShare.createdAt), asc(expenseShare.id));

    return rows.map((r) => this.map(r));
  }
}
