import { BalanceRepository } from "@/repositories/balance-repository";
import { type DBTransactionType } from "@/db";

/**
 * Centralized helper for mutating bilateral user balances.
 * Canonical sign convention:
 *   Positive amount (owner -> counterParty) means: counterParty owes owner.
 *   Negative amount means: owner owes counterParty.
 *
 * applyBilateralDelta(creditorId, debtorId, amount) expresses that the debtor owes the creditor `amount` more.
 * It will:
 *   owner=creditorId,  counterParty=debtorId  += +amount
 *   owner=debtorId,    counterParty=creditorId += -amount
 *
 * Passing a negative `amount` reduces the debt (i.e. settlement / repayment).
 */
export class BalanceAdjustmentService {
  private readonly balanceRepository: BalanceRepository;

  constructor({ balanceRepository }: { balanceRepository: BalanceRepository }) {
    this.balanceRepository = balanceRepository;
  }

  async applyBilateralDelta(
    creditorId: number,
    debtorId: number,
    amount: number,
    currency: string,
    groupId?: number | null,
    tx?: DBTransactionType
  ): Promise<void> {
    if (amount === 0) return; // no-op

    // Creditor perspective row (positive)
    const creditorRow = await this.balanceRepository.findBalance(
      creditorId,
      debtorId,
      groupId ?? undefined,
      tx
    );

    if (creditorRow) {
      await this.balanceRepository.update(
        creditorRow.id,
        { amount: creditorRow.amount + amount },
        tx
      );
    } else {
      await this.balanceRepository.create(
        {
          ownerId: creditorId,
          counterPartyId: debtorId,
          amount: amount,
          currency,
          groupId: groupId === undefined ? undefined : (groupId ?? undefined),
        },
        tx
      );
    }

    // Debtor perspective row (negative)
    const debtorRow = await this.balanceRepository.findBalance(
      debtorId,
      creditorId,
      groupId ?? undefined,
      tx
    );

    if (debtorRow) {
      await this.balanceRepository.update(
        debtorRow.id,
        { amount: debtorRow.amount - amount },
        tx
      );
    } else {
      await this.balanceRepository.create(
        {
          ownerId: debtorId,
          counterPartyId: creditorId,
          amount: -amount,
          currency,
          groupId: groupId === undefined ? undefined : (groupId ?? undefined),
        },
        tx
      );
    }
  }
}
