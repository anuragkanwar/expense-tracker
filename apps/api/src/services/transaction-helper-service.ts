import {
  TransactionRepository,
  TransactionEntryRepository,
  TransactionAccountRepository,
} from "@/repositories";
import type { TransactionAccountResponse } from "@/models/transaction-account";

export class TransactionHelperService {
  private readonly transactionRepository;
  private readonly transactionEntryRepository;
  private readonly transactionAccountRepository;

  constructor({
    transactionRepository,
    transactionEntryRepository,
    transactionAccountRepository,
  }: {
    transactionRepository: TransactionRepository;
    transactionEntryRepository: TransactionEntryRepository;
    transactionAccountRepository: TransactionAccountRepository;
  }) {
    this.transactionRepository = transactionRepository;
    this.transactionEntryRepository = transactionEntryRepository;
    this.transactionAccountRepository = transactionAccountRepository;
  }

  async updateAccountsAndCreateEntries(
    entries: Array<{
      srcAcc: TransactionAccountResponse;
      dstAcc: TransactionAccountResponse;
      amount: number;
      txnId: number;
    }>
  ): Promise<void> {
    for (const entry of entries) {
      if (entry.amount <= 0) {
        continue;
      }

      // Update source account balance (money going out)
      await this.transactionAccountRepository.update(entry.srcAcc.id, {
        balance: entry.srcAcc.balance - entry.amount,
      });

      // Update destination account balance (money coming in)
      await this.transactionAccountRepository.update(entry.dstAcc.id, {
        balance: entry.dstAcc.balance + entry.amount,
      });

      // Create transaction entries (double-entry)
      await this.transactionEntryRepository.create({
        amount: entry.amount,
        transactionAccountId: entry.dstAcc.id,
        transactionId: entry.txnId,
      });

      await this.transactionEntryRepository.create({
        amount: -entry.amount,
        transactionAccountId: entry.srcAcc.id,
        transactionId: entry.txnId,
      });
    }
  }
}
