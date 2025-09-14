import { loan } from "@/db";
import { eq } from "drizzle-orm";
import type {
  LoanResponse,
  LoanCreate,
  LoanUpdate,
} from "@pocket-pixie/contracts";
import { type DBType, type DBTransactionType } from "@/db";

export class LoanRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<LoanResponse[]> {
    const db = tx ?? this.db;
    const result = await db.select().from(loan).limit(limit).offset(offset);
    return result.map((item) => ({
      ...item,
      loanDate: item.loanDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as LoanResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;
    const result = await db.select().from(loan).where(eq(loan.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }
    const item = result[0]!;
    return {
      ...item,
      loanDate: item.loanDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as any;
  }

  async create(
    data: LoanCreate,
    tx?: DBTransactionType
  ): Promise<LoanResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      loanDate: data.loanDate ? new Date(data.loanDate) : undefined,
    };

    const result = await db.insert(loan).values(insertData).returning();

    if (result.length === 0) {
      throw new Error("Failed to create loan");
    }

    const item = result[0]!;
    return {
      ...item,
      loanDate: item.loanDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as any;
  }

  async update(
    id: number,
    data: LoanUpdate,
    tx?: DBTransactionType
  ): Promise<LoanResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      loanDate: data.loanDate ? new Date(data.loanDate) : undefined,
      updatedAt: new Date(),
    };

    await db.update(loan).set(updateData).where(eq(loan.id, id));

    return await this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(loan).where(eq(loan.id, id));

    return result.rowsAffected > 0;
  }
}
