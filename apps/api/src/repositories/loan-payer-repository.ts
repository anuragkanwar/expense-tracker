import { loanPayer } from "@/db";
import { eq } from "drizzle-orm";
import {
  LoanPayerResponse,
  LoanPayerCreate,
  LoanPayerUpdate,
} from "@/models/loan-payer";
import { type DBType, type DBTransactionType } from "@/db";

export class LoanPayerRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<LoanPayerResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanPayer)
      .limit(limit)
      .offset(offset);
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as LoanPayerResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<LoanPayerResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanPayer)
      .where(eq(loanPayer.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as LoanPayerResponse;
  }

  async findByLoanId(
    loanId: number,
    tx?: DBTransactionType
  ): Promise<LoanPayerResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(loanPayer)
      .where(eq(loanPayer.loanId, loanId));
    return result.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as LoanPayerResponse[];
  }

  async create(
    data: LoanPayerCreate,
    tx?: DBTransactionType
  ): Promise<LoanPayerResponse> {
    const db = tx ?? this.db;
    const result = await db.insert(loanPayer).values(data).returning();

    if (result.length === 0) {
      throw new Error("Failed to create loan payer");
    }

    const item = result[0]!;
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as LoanPayerResponse;
  }

  async update(
    id: number,
    data: LoanPayerUpdate,
    tx?: DBTransactionType
  ): Promise<LoanPayerResponse | null> {
    const db = tx ?? this.db;
    await db.update(loanPayer).set(data).where(eq(loanPayer.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(loanPayer).where(eq(loanPayer.id, id));

    return result.rowsAffected > 0;
  }
}
