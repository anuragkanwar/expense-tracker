import {
  transaction,
  transactionEntry,
  transactionAccount,
} from "@pocket-pixie/db-schema";
import { eq } from "drizzle-orm";
import type {
  TransactionResponse,
  TransactionCreate,
  TransactionUpdate,
  TransactionEntryWithAccount,
} from "@pocket-pixie/contracts";
import {
  type DBType,
  type DBTransactionType,
  ACCOUNT_TYPE,
} from "@pocket-pixie/db-schema";

export class TransactionRepository {
  private db: DBType;
  constructor({ db }: { db: DBType }) {
    this.db = db;
  }

  /**
   * Determines transaction type from account types and selects the most relevant entry
   * for user display based on LLD patterns:
   * - EXPENSE: Return positive entry (destination EXPENSE account)
   * - INCOME: Return positive entry (destination INCOME account)
   * - SAVING: Return positive entry (destination SAVING account)
   * - LOAN_GIVEN: Return negative entry (creditor's perspective - money given out)
   * - LOAN_TAKEN: Return positive entry (debtor's perspective - money received)
   * - SHARED EXPENSE: Payer sees EXPENSE, participants see LOAN_TAKEN (as expense obligation)
   */
  private selectRelevantEntry(
    entries: TransactionEntryWithAccount[],
    userId: number
  ): TransactionEntryWithAccount {
    if (entries.length === 0) {
      throw new Error("Transaction must have at least one entry");
    }
    if (entries.length === 1) return entries[0]!;

    // Group entries by account type to determine transaction pattern
    const outgoingEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.OUTGOING
    );
    const externalEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.EXTERNAL
    );
    const expenseEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.EXPENSE
    );
    const incomeEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.INCOME
    );
    const savingEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.SAVING
    );
    const loanGivenEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.LOAN_GIVEN
    );
    const loanTakenEntries = entries.filter(
      (e) => e.transactionAccount.type === ACCOUNT_TYPE.LOAN_TAKEN
    );

    // Personal Expense: OUTGOING (-) → EXPENSE (+)
    if (
      outgoingEntries.length > 0 &&
      expenseEntries.length > 0 &&
      loanGivenEntries.length === 0 &&
      loanTakenEntries.length === 0
    ) {
      const positiveExpense = expenseEntries.find((e) => e.amount > 0);
      return positiveExpense ?? expenseEntries[0]!;
    }

    // Shared Expense: OUTGOING (-) → EXPENSE (+) for payer + LOAN_GIVEN (-) → LOAN_TAKEN (+) for participants
    if (
      outgoingEntries.length > 0 &&
      expenseEntries.length > 0 &&
      loanGivenEntries.length > 0 &&
      loanTakenEntries.length > 0
    ) {
      // Check if user is the payer (has OUTGOING + EXPENSE entries)
      const userOutgoingEntry = outgoingEntries.find(
        (e) => e.transactionAccount.userId === userId
      );
      const userExpenseEntry = expenseEntries.find(
        (e) => e.transactionAccount.userId === userId
      );

      if (userOutgoingEntry && userExpenseEntry) {
        // User is the payer - return the EXPENSE entry (what they bought)
        const positiveExpense = expenseEntries.find((e) => e.amount > 0);
        return positiveExpense ?? expenseEntries[0]!;
      } else {
        // User is a participant - this is a shared expense, show as expense obligation
        // Even though ledger uses LOAN_GIVEN → LOAN_TAKEN, semantically this is their share of the expense
        const userLoanTaken = loanTakenEntries.find(
          (e) => e.transactionAccount.userId === userId
        );
        if (userLoanTaken) {
          // For shared expense participants, return positive LOAN_TAKEN entry (their obligation)
          // This represents "your share of the expense" rather than a direct loan
          return userLoanTaken;
        }
      }
    }

    // Income: EXTERNAL (-) → INCOME (+)
    if (externalEntries.length > 0 && incomeEntries.length > 0) {
      const positiveIncome = incomeEntries.find((e) => e.amount > 0);
      return positiveIncome ?? incomeEntries[0]!;
    }

    // Saving: OUTGOING (-) → SAVING (+)
    if (
      outgoingEntries.length > 0 &&
      savingEntries.length > 0 &&
      loanGivenEntries.length === 0 &&
      loanTakenEntries.length === 0
    ) {
      const positiveSaving = savingEntries.find((e) => e.amount > 0);
      return positiveSaving ?? savingEntries[0]!;
    }

    // Direct Loan: LOAN_GIVEN (-) → LOAN_TAKEN (+)
    // Distinguish from shared expense by checking if there are no OUTGOING/EXPENSE entries
    if (
      loanGivenEntries.length > 0 &&
      loanTakenEntries.length > 0 &&
      outgoingEntries.length === 0 &&
      expenseEntries.length === 0
    ) {
      const userLoanGiven = loanGivenEntries.find(
        (e) => e.transactionAccount.userId === userId
      );
      const userLoanTaken = loanTakenEntries.find(
        (e) => e.transactionAccount.userId === userId
      );

      if (userLoanGiven) {
        // User is creditor - return the negative entry (money given out)
        return userLoanGiven;
      } else if (userLoanTaken) {
        // User is debtor - return the positive entry (money received)
        return userLoanTaken;
      }
      return loanGivenEntries[0]!;
    }

    // Settlement: LOAN_TAKEN (-) → LOAN_GIVEN (+)
    if (loanTakenEntries.length > 0 && loanGivenEntries.length > 0) {
      const payerEntry = loanTakenEntries.find(
        (e) => e.amount < 0 && e.transactionAccount.userId === userId
      );
      if (payerEntry) return payerEntry;

      const payeeEntry = loanGivenEntries.find((e) => e.amount > 0);
      return payeeEntry ?? loanGivenEntries[0]!;
    }

    // Fallback: return positive entry if available, otherwise first entry
    const positiveEntry = entries.find((e) => e.amount > 0);
    return positiveEntry ?? entries[0]!;
  }

  async findAll(
    limit: number = 10,
    offset: number = 0,
    tx?: DBTransactionType
  ): Promise<TransactionResponse[]> {
    const db = tx ?? this.db;

    // Get transactions with their entries and accounts
    const transactionsWithEntries = await db
      .select({
        // Transaction fields
        id: transaction.id,
        description: transaction.description,
        userId: transaction.userId,
        transactionDate: transaction.transactionDate,
        parentTransactionId: transaction.parentTransactionId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        // Entry fields
        entryId: transactionEntry.id,
        entryAmount: transactionEntry.amount,
        entryTransactionAccountId: transactionEntry.transactionAccountId,
        entryCreatedAt: transactionEntry.createdAt,
        entryUpdatedAt: transactionEntry.updatedAt,
        // Account fields
        accountId: transactionAccount.id,
        accountName: transactionAccount.name,
        accountType: transactionAccount.type,
        accountUserId: transactionAccount.userId,
      })
      .from(transaction)
      .leftJoin(
        transactionEntry,
        eq(transaction.id, transactionEntry.transactionId)
      )
      .leftJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .limit(limit)
      .offset(offset)
      .orderBy(transaction.transactionDate);

    // Group by transaction and process entries
    const transactionMap = new Map<number, any>();

    for (const row of transactionsWithEntries) {
      if (!transactionMap.has(row.id)) {
        transactionMap.set(row.id, {
          id: row.id,
          description: row.description,
          userId: row.userId,
          transactionDate: row.transactionDate?.toISOString(),
          parentTransactionId: row.parentTransactionId,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          entries: [],
        });
      }

      if (
        row.entryId &&
        row.entryCreatedAt &&
        row.entryUpdatedAt &&
        row.accountId
      ) {
        const entry = {
          id: row.entryId,
          amount: row.entryAmount,
          transactionAccountId: row.entryTransactionAccountId,
          transactionId: row.id,
          createdAt: row.entryCreatedAt.toISOString(),
          updatedAt: row.entryUpdatedAt.toISOString(),
          transactionAccount: {
            id: row.accountId,
            name: row.accountName || "Unknown Account",
            type: row.accountType || "UNKNOWN",
            userId: row.accountUserId,
          },
        };

        transactionMap.get(row.id).entries.push(entry);
      }
    }

    // Process transactions to select relevant entry for each
    const result = Array.from(transactionMap.values()).map((txn: any) => {
      // Select the most relevant entry based on user perspective and transaction type
      const relevantEntry = this.selectRelevantEntry(txn.entries, txn.userId);

      return {
        ...txn,
        entry: relevantEntry,
      };
    });

    return result as TransactionResponse[];
  }

  async findById(
    id: number,
    tx?: DBTransactionType
  ): Promise<TransactionResponse | null> {
    const db = tx ?? this.db;

    // Get transaction with its entries and accounts
    const transactionsWithEntries = await db
      .select({
        // Transaction fields
        id: transaction.id,
        description: transaction.description,
        userId: transaction.userId,
        transactionDate: transaction.transactionDate,
        parentTransactionId: transaction.parentTransactionId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        // Entry fields
        entryId: transactionEntry.id,
        entryAmount: transactionEntry.amount,
        entryTransactionAccountId: transactionEntry.transactionAccountId,
        entryCreatedAt: transactionEntry.createdAt,
        entryUpdatedAt: transactionEntry.updatedAt,
        // Account fields
        accountId: transactionAccount.id,
        accountName: transactionAccount.name,
        accountType: transactionAccount.type,
        accountUserId: transactionAccount.userId,
      })
      .from(transaction)
      .leftJoin(
        transactionEntry,
        eq(transaction.id, transactionEntry.transactionId)
      )
      .leftJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .where(eq(transaction.id, id));

    if (transactionsWithEntries.length === 0) {
      return null;
    }

    const rows = transactionsWithEntries;
    const firstRow = rows[0];

    if (!firstRow) return null;

    // Group by transaction and process entries
    const txn: any = {
      id: firstRow.id,
      description: firstRow.description,
      userId: firstRow.userId,
      transactionDate: firstRow.transactionDate?.toISOString(),
      parentTransactionId: firstRow.parentTransactionId,
      createdAt: firstRow.createdAt.toISOString(),
      updatedAt: firstRow.updatedAt.toISOString(),
      entries: [],
    };

    for (const row of rows) {
      if (
        row.entryId &&
        row.entryCreatedAt &&
        row.entryUpdatedAt &&
        row.accountId
      ) {
        const entry = {
          id: row.entryId,
          amount: row.entryAmount,
          transactionAccountId: row.entryTransactionAccountId,
          transactionId: row.id,
          createdAt: row.entryCreatedAt.toISOString(),
          updatedAt: row.entryUpdatedAt.toISOString(),
          transactionAccount: {
            id: row.accountId,
            name: row.accountName || "Unknown Account",
            type: row.accountType || "UNKNOWN",
            userId: row.accountUserId,
          },
        };

        txn.entries.push(entry);
      }
    }

    // Select the most relevant entry based on user perspective and transaction type
    const relevantEntry = this.selectRelevantEntry(txn.entries, txn.userId);

    return {
      ...txn,
      entry: relevantEntry,
    } as TransactionResponse;
  }

  async findByUserId(
    userId: number,
    tx?: DBTransactionType
  ): Promise<TransactionResponse[]> {
    const db = tx ?? this.db;

    // Get transactions with their entries and accounts
    const transactionsWithEntries = await db
      .select({
        // Transaction fields
        id: transaction.id,
        description: transaction.description,
        userId: transaction.userId,
        transactionDate: transaction.transactionDate,
        parentTransactionId: transaction.parentTransactionId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        // Entry fields
        entryId: transactionEntry.id,
        entryAmount: transactionEntry.amount,
        entryTransactionAccountId: transactionEntry.transactionAccountId,
        entryCreatedAt: transactionEntry.createdAt,
        entryUpdatedAt: transactionEntry.updatedAt,
        // Account fields
        accountId: transactionAccount.id,
        accountName: transactionAccount.name,
        accountType: transactionAccount.type,
        accountUserId: transactionAccount.userId,
      })
      .from(transaction)
      .leftJoin(
        transactionEntry,
        eq(transaction.id, transactionEntry.transactionId)
      )
      .leftJoin(
        transactionAccount,
        eq(transactionEntry.transactionAccountId, transactionAccount.id)
      )
      .where(eq(transaction.userId, userId))
      .orderBy(transaction.transactionDate);

    // Group by transaction and process entries
    const transactionMap = new Map<number, any>();

    for (const row of transactionsWithEntries) {
      if (!transactionMap.has(row.id)) {
        transactionMap.set(row.id, {
          id: row.id,
          description: row.description,
          userId: row.userId,
          transactionDate: row.transactionDate?.toISOString(),
          parentTransactionId: row.parentTransactionId,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          entries: [],
        });
      }

      if (
        row.entryId &&
        row.entryCreatedAt &&
        row.entryUpdatedAt &&
        row.accountId
      ) {
        const entry = {
          id: row.entryId,
          amount: row.entryAmount,
          transactionAccountId: row.entryTransactionAccountId,
          transactionId: row.id,
          createdAt: row.entryCreatedAt.toISOString(),
          updatedAt: row.entryUpdatedAt.toISOString(),
          transactionAccount: {
            id: row.accountId,
            name: row.accountName || "Unknown Account",
            type: row.accountType || "UNKNOWN",
            userId: row.accountUserId,
          },
        };

        transactionMap.get(row.id).entries.push(entry);
      }
    }

    // Process transactions to select relevant entry for each
    const result = Array.from(transactionMap.values()).map((txn: any) => {
      // Select the most relevant entry based on user perspective and transaction type
      const relevantEntry = this.selectRelevantEntry(txn.entries, txn.userId);

      return {
        ...txn,
        entry: relevantEntry,
      };
    });

    return result as TransactionResponse[];
  }

  async create(
    data: TransactionCreate,
    tx?: DBTransactionType
  ): Promise<TransactionResponse> {
    const db = tx ?? this.db;
    const insertData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
    };

    const result = await db.insert(transaction).values(insertData).returning();

    if (result.length === 0) {
      throw new Error("Failed to create transaction");
    }

    const item = result[0]!;
    return {
      ...item,
      transactionDate: item.transactionDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    } as TransactionResponse;
  }

  async update(
    id: number,
    data: TransactionUpdate,
    tx?: DBTransactionType
  ): Promise<TransactionResponse | null> {
    const db = tx ?? this.db;
    const updateData = {
      ...data,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : undefined,
      updatedAt: new Date(),
    };

    await db.update(transaction).set(updateData).where(eq(transaction.id, id));

    return this.findById(id, tx);
  }

  async delete(id: number, tx?: DBTransactionType): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(transaction).where(eq(transaction.id, id));

    return result.rowsAffected > 0;
  }
}
