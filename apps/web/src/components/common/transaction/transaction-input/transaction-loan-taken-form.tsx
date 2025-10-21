import { SHARE_TYPE, TXN_TYPE } from "@pocket-pixie/contracts";
import { useField, useForm } from "@tanstack/react-form";
import { useCreateTransaction } from "@/api/transaction/createTransaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const TransactionLoanTakenForm = () => {
  const mutation = useCreateTransaction();

  const form = useForm({
    defaultValues: {
      type: TXN_TYPE.LOAN_TAKEN,
      description: "",
      amount: 0,
      payer: 1,
      sharedWith: SHARE_TYPE.NONE,
      sourceTransactionAccountID: 5,
      targetTransactionAccountID: 3,
      groupId: 1,
      loanDate: new Date().toISOString(),
    },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
  });

  const amountField = useField({ form, name: "amount" });
  const descriptionField = useField({ form, name: "description" });
  const sourceAccountField = useField({
    form,
    name: "sourceTransactionAccountID",
  });
  const targetAccountField = useField({
    form,
    name: "targetTransactionAccountID",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="py-4 flex flex-col gap-4"
    >
      <Input
        type="number"
        placeholder="Amount"
        value={amountField.state.value}
        onChange={(e) => amountField.handleChange(Number(e.target.value))}
      />
      <Select
        value={sourceAccountField.state.value?.toString()}
        onValueChange={(value) =>
          sourceAccountField.setValue(parseInt(value, 10))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Lender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">User 2</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={targetAccountField.state.value?.toString()}
        onValueChange={(value) =>
          targetAccountField.setValue(parseInt(value, 10))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Target Account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">Account 3</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Description"
        value={descriptionField.state.value}
        onChange={(e) => descriptionField.handleChange(e.target.value)}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Submitting..." : "Add Loan Taken"}
      </Button>
    </form>
  );
};
