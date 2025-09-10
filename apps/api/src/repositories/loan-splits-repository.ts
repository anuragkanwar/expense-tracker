import { loanSplit } from "@/db";
import { eq } from "drizzle-orm";
import {
  LoanSplitResponse,
  LoanSplitCreate,
  LoanSplitUpdate,
} from "@/models/loan-split";
import { type DBType, type DBTransactionType } from "@/db";

export class LoanSplitsRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<LoanSplitResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanSplit)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as LoanSplitResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<LoanSplitResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanSplit)
      .where(eq(loanSplit.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as LoanSplitResponse;
  }

  async findByLoanId(
    loanId: number,
    tx?: DBTransactionType
  ): Promise<LoanSplitResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanSplit)
      .where(eq(loanSplit.loanId, loanId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as LoanSplitResponse[];
  }

  async create(
    data: LoanSplitCreate,
    tx?: DBTransactionType
  ): Promise<LoanSplitResponse> {
    const db = tx ?? this.db;
    const result = await db.insert(loanSplit).values(data).returning();

    if (result.length === 0) {
      throw new Error("Failed to create loan split");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as LoanSplitResponse;
  }

  async update(
    id: number,
    data: LoanSplitUpdate,
    tx?: DBTransactionType
  ): Promise<LoanSplitResponse | null> {
    const db = tx ?? this.db;
    await db.update(loanSplit).set(data).where(eq(loanSplit.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(loanSplit).where(eq(loanSplit.id, id));

    return result.rowsAffected > 0;
  }
}
