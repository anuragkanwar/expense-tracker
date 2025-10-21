import { TXN_TYPE } from "@pocket-pixie/contracts";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionExpenseForm } from "./transaction-expense-form";
import { TransactionIncomeForm } from "./transaction-income-form";
import { TransactionLoanGivenForm } from "./transaction-loan-given-form";
import { TransactionLoanTakenForm } from "./transaction-loan-taken-form";
import { TransactionSavingForm } from "./transaction-saving-form";
import { QueryBoundary } from "../../boundry/query-boundry";

export const TransactionInputCard = () => {
  const [txnType, setTxnType] = useState<TXN_TYPE>(TXN_TYPE.EXPENSE);

  const renderForm = () => {
    switch (txnType) {
      case TXN_TYPE.EXPENSE:
        return <TransactionExpenseForm />;
      case TXN_TYPE.INCOME:
        return <TransactionIncomeForm />;
      case TXN_TYPE.SAVING:
        return <TransactionSavingForm />;
      case TXN_TYPE.LOAN_GIVEN:
        return <TransactionLoanGivenForm />;
      case TXN_TYPE.LOAN_TAKEN:
        return <TransactionLoanTakenForm />;
      default:
        return null;
    }
  };

  return (
    <QueryBoundary>
      <div className="py-4 flex flex-col gap-4">
        <Select
          value={txnType}
          onValueChange={(val) => setTxnType(val as TXN_TYPE)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Transaction Type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(TXN_TYPE).map((ty) => (
              <SelectItem key={ty} value={ty}>
                {ty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderForm()}
      </div>
    </QueryBoundary>
  );
};
