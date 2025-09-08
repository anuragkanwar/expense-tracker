import {
  userBalance,
  expense,
  expenseSplit,
  transactionEntry,
  transactionAccount,
  ACCOUNT_TYPE,
} from "@/db";
import { eq, and, sql, isNull, or, gt } from "drizzle-orm";
import {
  UserBalanceResponse,
  UserBalanceCreate,
  UserBalanceUpdate,
} from "@/models/user-balance";
import { type DBType, type DBTransactionType } from "@/db";

export class BalanceRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .limit(limit)
      .offset(offset);
    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(eq(userBalance.id, id))
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
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as UserBalanceResponse;
  }

  async create(
    data: UserBalanceCreate,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse> {
    const db = tx ?? this.db;
    const result = await db
      .insert(userBalance)
      .values({
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      })
      .returning({ id: userBalance.id });

    if (result.length === 0 || !result[0]) {
      throw new Error("Failed to create balance");
    }

    const created = await this.findById(result[0].id, tx);
    if (!created) {
      throw new Error("Failed to create balance");
    }

    return created;
  }

  async update(
    id: number,
    data: UserBalanceUpdate,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse | null> {
    const db = tx ?? this.db;
    await db
      .update(userBalance)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userBalance.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(userBalance).where(eq(userBalance.id, id));

    return result.rowsAffected > 0;
  }

  async getUserBalances(
    userId: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(eq(userBalance.ownerId, userId));

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async getBalancesBetweenUsers(
    userId1: number,
    userId2: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(
        and(
          or(
            and(
              eq(userBalance.ownerId, userId1),
              eq(userBalance.counterPartyId, userId2)
            ),
            and(
              eq(userBalance.ownerId, userId2),
              eq(userBalance.counterPartyId, userId1)
            )
          ),
          isNull(userBalance.groupId)
        )
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async getGroupBalances(
    userId: number,
    groupId: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(
        and(eq(userBalance.ownerId, userId), eq(userBalance.groupId, groupId))
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async getUserDebts(
    userId: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(
        and(
          eq(userBalance.ownerId, userId),
          sql`${userBalance.amount} < 0`,
          isNull(userBalance.groupId)
        )
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async getGroupBalancesForSettlement(
    userId: number,
    groupId: number,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(userBalance)
      .where(
        and(
          eq(userBalance.groupId, groupId),
          or(
            eq(userBalance.ownerId, userId),
            eq(userBalance.counterPartyId, userId)
          )
        )
      );

    return result.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as UserBalanceResponse[];
  }

  async findBalance(
    ownerId: number,
    counterPartyId: number,
    groupId?: number | null,
    tx?: DBTransactionType
  ): Promise<UserBalanceResponse | null> {
    const db = tx ?? this.db;
    const conditions = [
      eq(userBalance.ownerId, ownerId),
      eq(userBalance.counterPartyId, counterPartyId),
    ];

    if (groupId !== undefined) {
      if (groupId === null || groupId === undefined) {
        conditions.push(isNull(userBalance.groupId));
      } else {
        conditions.push(eq(userBalance.groupId, groupId));
      }
    }

    const result = await db
      .select()
      .from(userBalance)
      .where(and(...conditions))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as UserBalanceResponse;
  }

  async getSettlementCategory(
    groupId: number,
    payerId: number,
    payeeId: number,
    tx?: DBTransactionType
  ): Promise<string> {
    const db = tx ?? this.db;

    // Find the underlying expense category from transaction accounts
    const expenseQuery = await db
      .select({ transactionId: expense.transactionId })
      .from(expense)
      .innerJoin(expenseSplit, eq(expense.id, expenseSplit.expenseId))
      .where(
        and(
          eq(expense.groupId, groupId),
          eq(expense.createdBy, payerId),
          eq(expenseSplit.userId, payeeId)
        )
      )
      .limit(1);

    let category = "GENERAL";
    if (expenseQuery.length > 0) {
      const txnId = expenseQuery[0]?.transactionId;
      if (txnId) {
        const entryQuery = await db
          .select({
            transactionAccountId: transactionEntry.transactionAccountId,
          })
          .from(transactionEntry)
          .where(
            and(
              eq(transactionEntry.transactionId, txnId),
              gt(transactionEntry.amount, 0)
            )
          )
          .limit(1);

        if (entryQuery.length > 0) {
          const accountId = entryQuery[0]?.transactionAccountId;
          if (accountId) {
            const accountQuery = await db
              .select({ name: transactionAccount.name })
              .from(transactionAccount)
              .where(
                and(
                  eq(transactionAccount.id, accountId),
                  eq(transactionAccount.type, ACCOUNT_TYPE.EXPENSE)
                )
              )
              .limit(1);

            if (accountQuery.length > 0) {
              category = accountQuery[0]?.name || "GENERAL";
            }
          }
        }
      }
    }

    return category;
  }
}
