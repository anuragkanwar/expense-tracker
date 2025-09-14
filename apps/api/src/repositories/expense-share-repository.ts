import { expenseShare } from "@/db";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { type DBType, type DBTransactionType } from "@/db";
import { EXPENSE_SHARE_STATUS, SHARE_TYPE, SPLIT_TYPE } from "@/db";

// Drizzle inferred row type
type ExpenseShareSelect = typeof expenseShare.$inferSelect;
// Condition helpers union we build dynamically
type Condition = ReturnType<typeof eq> | ReturnType<typeof inArray>;

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
  metadata?: unknown; // JSON metadata blob (opaque to domain layer)
}

export interface ExpenseShareUpdate {
  paidAmount?: number;
  status?: EXPENSE_SHARE_STATUS;
  metadata?: unknown;
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
  metadata?: unknown;
  createdAt: string;
  updatedAt: string;
}

export class ExpenseShareRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  private map(row: ExpenseShareSelect): ExpenseShareResponse {
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
    return this.map(rows[0]!);
  }

  async findAllocatableShares(
    participantUserId: number,
    payerUserId: number,
    currency: string,
    groupId?: number | null,
    tx?: DBTransactionType
  ): Promise<ExpenseShareResponse[]> {
    const db = tx ?? this.db;
    const conditions: Condition[] = [
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
      // groupId may be null or number
      conditions.push(
        groupId === null
          ? (isNull(expenseShare.groupId) as Condition)
          : eq(expenseShare.groupId, groupId)
      );
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

    // Role-specific fetch logic
    if (filters.isPayer === undefined) {
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
      const map = new Map<number, ExpenseShareSelect>();
      for (const r of combined) {
        map.set(r.id, r);
      }
      return Array.from(map.values())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((r) => this.map(r));
    }

    const conditions: Condition[] = [];
    if (filters.isPayer === true) {
      conditions.push(eq(expenseShare.payerUserId, userId));
    } else if (filters.isPayer === false) {
      conditions.push(eq(expenseShare.participantUserId, userId));
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
