import type {
  RecurringResponse,
  RecurringCreate,
  RecurringUpdate,
} from "@pocket-pixie/contracts";
import { BadRequestError } from "../errors/base-error";
import { RecurringRepository } from "@/repositories/recurring-repository";
import { TransactionAccountRepository } from "@/repositories/transaction-account-repository";
import { ACCOUNT_TYPE, RECURRENCE_TYPE } from "@/db/constants";

interface ResolvedAccounts {
  sourceAccountId: number;
  targetAccountId: number;
}

export class RecurringService {
  private readonly recurringRepository;
  private readonly transactionAccountRepository;

  constructor({
    recurringRepository,
    transactionAccountRepository,
  }: {
    recurringRepository: RecurringRepository;
    transactionAccountRepository: TransactionAccountRepository;
  }) {
    this.recurringRepository = recurringRepository;
    this.transactionAccountRepository = transactionAccountRepository;
  }

  async getAllRecurringItems(
    limit: number = 10,
    offset: number = 0
  ): Promise<RecurringResponse[]> {
    return this.recurringRepository.findAll(limit, offset);
  }

  async getRecurringItemsByUserId(
    userId: number
  ): Promise<RecurringResponse[]> {
    if (!userId || typeof userId !== "number") {
      throw new BadRequestError("Invalid user ID");
    }

    return this.recurringRepository.findByUserId(userId);
  }

  async getRecurringItemById(id: number): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    return this.recurringRepository.findById(id);
  }

  async getRecurringItemByIdAndUser(
    userId: number,
    itemId: number
  ): Promise<RecurringResponse> {
    if (!itemId || typeof itemId !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const item = await this.recurringRepository.findById(itemId);
    if (!item) {
      throw new BadRequestError("Recurring item not found");
    }

    if (item.userId !== userId) {
      throw new BadRequestError("Forbidden");
    }

    return item;
  }

  async createRecurringItem(data: RecurringCreate): Promise<RecurringResponse> {
    return this.recurringRepository.create(data);
  }

  async createRecurringItemWithResolution(
    userId: number,
    data: any, // DTO data
    recurrenceType: RECURRENCE_TYPE,
    categoryName?: string,
    accountType?: ACCOUNT_TYPE
  ): Promise<RecurringResponse> {
    const resolvedAccounts = await this.resolveAccountsForRecurringItem(
      userId,
      recurrenceType,
      categoryName,
      accountType
    );

    await this.validateResolvedAccounts(userId, resolvedAccounts);

    const recurringData = {
      ...data,
      userId,
      sourceTransactionAccountID: resolvedAccounts.sourceAccountId,
      targetTransactionAccountID: resolvedAccounts.targetAccountId,
    };

    return this.recurringRepository.create(recurringData);
  }

  async updateRecurringItem(
    id: number,
    data: RecurringUpdate
  ): Promise<RecurringResponse | null> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const existingItem = await this.recurringRepository.findById(id);
    if (!existingItem) {
      return null;
    }

    return this.recurringRepository.update(id, data);
  }

  async updateRecurringItemByUser(
    userId: number,
    itemId: number,
    data: RecurringUpdate
  ): Promise<RecurringResponse | null> {
    await this.getRecurringItemByIdAndUser(userId, itemId);
    return this.recurringRepository.update(itemId, data);
  }

  async updateRecurringItemWithResolution(
    userId: number,
    itemId: number,
    data: any, // DTO data
    recurrenceType: RECURRENCE_TYPE,
    categoryName?: string,
    accountType?: ACCOUNT_TYPE
  ): Promise<RecurringResponse | null> {
    await this.getRecurringItemByIdAndUser(userId, itemId);

    const resolvedAccounts = await this.resolveAccountsForRecurringItem(
      userId,
      recurrenceType,
      categoryName,
      accountType
    );

    await this.validateResolvedAccounts(userId, resolvedAccounts);

    const recurringData = {
      ...data,
      sourceTransactionAccountID: resolvedAccounts.sourceAccountId,
      targetTransactionAccountID: resolvedAccounts.targetAccountId,
    };

    return this.recurringRepository.update(itemId, recurringData);
  }

  async deleteRecurringItem(id: number): Promise<boolean> {
    if (!id || typeof id !== "number") {
      throw new BadRequestError("Invalid recurring item ID");
    }

    const existingItem = await this.recurringRepository.findById(id);
    if (!existingItem) {
      throw new BadRequestError("Recurring item not found");
    }

    return this.recurringRepository.delete(id);
  }

  async deleteRecurringItemByUser(
    userId: number,
    itemId: number
  ): Promise<boolean> {
    await this.getRecurringItemByIdAndUser(userId, itemId);
    return this.recurringRepository.delete(itemId);
  }

  /**
   * Resolves appropriate source and target accounts for a recurring item based on its type
   * @param userId - The user ID
   * @param recurrenceType - CREDIT for income, DEBIT for expense/saving
   * @param categoryName - Optional category name to find specific account
   * @param accountType - Optional account type (EXPENSE or SAVING for DEBIT)
   * @returns Promise<ResolvedAccounts> - Source and target account IDs
   */
  async resolveAccountsForRecurringItem(
    userId: number,
    recurrenceType: RECURRENCE_TYPE,
    categoryName?: string,
    accountType?: ACCOUNT_TYPE
  ): Promise<ResolvedAccounts> {
    if (recurrenceType === RECURRENCE_TYPE.CREDIT) {
      // For income (CREDIT): EXTERNAL (-) → INCOME (+)
      // Money flows from external sources to user's income account
      return this.resolveIncomeAccounts(userId);
    } else if (recurrenceType === RECURRENCE_TYPE.DEBIT) {
      // For expense/saving (DEBIT): OUTGOING (-) → EXPENSE/SAVING (+)
      // Money flows from user's cash account to expense category or savings
      return this.resolveExpenseOrSavingAccounts(
        userId,
        categoryName,
        accountType
      );
    } else {
      throw new BadRequestError(
        `Unsupported recurrence type: ${recurrenceType}`
      );
    }
  }

  /**
   * Resolves accounts for income transactions
   * Source: EXTERNAL account (money source)
   * Target: INCOME account (where money goes)
   * Flow: EXTERNAL (-) → INCOME (+)
   */
  private async resolveIncomeAccounts(
    userId: number
  ): Promise<ResolvedAccounts> {
    // Find EXTERNAL account for source (external money source)
    const externalAccount =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        userId,
        ACCOUNT_TYPE.EXTERNAL
      );
    if (!externalAccount) {
      throw new BadRequestError(
        "No external account found. Please create an external account first."
      );
    }

    // Find INCOME account for target (user's income account)
    const incomeAccount =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        userId,
        ACCOUNT_TYPE.INCOME
      );
    if (!incomeAccount) {
      throw new BadRequestError(
        "No income account found. Please create an income account first."
      );
    }

    return {
      sourceAccountId: externalAccount.id,
      targetAccountId: incomeAccount.id,
    };
  }

  /**
   * Resolves accounts for expense or saving transactions
   * Source: OUTGOING account (user's cash)
   * Target: EXPENSE or SAVING account (where money goes)
   * Flow: OUTGOING (-) → EXPENSE/SAVING (+)
   */
  private async resolveExpenseOrSavingAccounts(
    userId: number,
    categoryName?: string,
    accountType?: ACCOUNT_TYPE
  ): Promise<ResolvedAccounts> {
    // Find OUTGOING account for source (user's cash account)
    const outgoingAccount =
      await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
        userId,
        ACCOUNT_TYPE.OUTGOING
      );
    if (!outgoingAccount) {
      throw new BadRequestError(
        "No outgoing account found. Please create an outgoing account first."
      );
    }

    // Determine target account based on type
    if (accountType === ACCOUNT_TYPE.SAVING) {
      // For savings: use the single SAVING account
      const savingAccount =
        await this.transactionAccountRepository.getSpecialAccountByUserIdAndAccountType(
          userId,
          ACCOUNT_TYPE.SAVING
        );
      if (!savingAccount) {
        throw new BadRequestError(
          "No saving account found. Please create a saving account first."
        );
      }
      return {
        sourceAccountId: outgoingAccount.id,
        targetAccountId: savingAccount.id,
      };
    } else {
      // For expenses: find specific expense account by category name
      if (!categoryName) {
        throw new BadRequestError(
          "Category name is required for expense recurring items."
        );
      }

      const expenseAccount =
        await this.transactionAccountRepository.findByUserIdAndCategoryName(
          userId,
          categoryName
        );

      if (!expenseAccount || expenseAccount.type !== ACCOUNT_TYPE.EXPENSE) {
        throw new BadRequestError(
          `Expense account with category "${categoryName}" not found. Please create it first.`
        );
      }

      return {
        sourceAccountId: outgoingAccount.id,
        targetAccountId: expenseAccount.id,
      };
    }
  }

  /**
   * Validates that the resolved accounts exist and belong to the user
   */
  async validateResolvedAccounts(
    userId: number,
    resolvedAccounts: ResolvedAccounts
  ): Promise<void> {
    const sourceAccount =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        userId,
        resolvedAccounts.sourceAccountId
      );
    if (!sourceAccount) {
      throw new BadRequestError(
        `Source account ${resolvedAccounts.sourceAccountId} not found or does not belong to user`
      );
    }

    const targetAccount =
      await this.transactionAccountRepository.findByUserIdAndAccountId(
        userId,
        resolvedAccounts.targetAccountId
      );
    if (!targetAccount) {
      throw new BadRequestError(
        `Target account ${resolvedAccounts.targetAccountId} not found or does not belong to user`
      );
    }
  }
}
