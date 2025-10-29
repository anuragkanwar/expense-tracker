import {
	ACCOUNT_TYPE,
	SHARE_TYPE,
	type TransactionAccountResponse,
	TXN_TYPE,
} from "@pocket-pixie/contracts";
import { useField, useForm } from "@tanstack/react-form";
import { useAccounts, useSpecialAccount } from "@/api/accounts";
import { useUser } from "@/api/auth/auth.hook";
import { useCreateTransaction } from "@/api/transactions";
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
import { QueryBoundary } from "../../boundry/query-boundry";

export const TransactionExpenseForm = () => {
	const mutation = useCreateTransaction();
	const { data: user } = useUser();
	const { data: outgoingAcc } = useSpecialAccount(ACCOUNT_TYPE.EXTERNAL);
	const { data: allAccounts } = useAccounts();

	const form = useForm({
		defaultValues: {
			description: "",
			amount: 0,
			sharedWith: SHARE_TYPE.NONE,
			targetTransactionAccountID: -1,
		},
		onSubmit: ({ value }) => {
			if (!outgoingAcc) {
				console.error("Outgoing account not found");
				return;
			}
			mutation.mutate({
				...value,
				type: TXN_TYPE.EXPENSE,
				sourceTransactionAccountID: outgoingAcc.id,
				payer: user.id,
			});
		},
	});

	const amountField = useField({ form, name: "amount" });
	const descriptionField = useField({ form, name: "description" });
	const targetTransactionAccountID = useField({
		form,
		name: "targetTransactionAccountID",
	});
	return (
		<QueryBoundary>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="py-4 flex flex-col gap-4"
			>
				<Textarea
					placeholder="Description"
					value={descriptionField.state.value}
					onChange={(e) => descriptionField.handleChange(e.target.value)}
				/>
				<Input
					type="number"
					placeholder="Amount"
					value={amountField.state.value}
					onChange={(e) => amountField.handleChange(Number(e.target.value))}
				/>
				<Select
					onValueChange={(val) => {
						targetTransactionAccountID.handleChange(parseInt(val, 10));
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						{allAccounts
							.filter((acc: TransactionAccountResponse) => {
								return (
									acc.name !== "INCOME" &&
									acc.name !== "LOAN_TAKEN" &&
									acc.name !== "LOAN_GIVEN" &&
									acc.name !== "EXTERNAL" &&
									acc.name !== "OUTGOING" &&
									acc.name !== "SAVING"
								);
							})
							.map((cat) => (
								<SelectItem key={cat.id} value={`${cat.id}`}>
									{cat.name}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
				<Button type="submit" disabled={mutation.isPending}>
					{mutation.isPending ? "Submitting..." : "Add Expense"}
				</Button>
			</form>
		</QueryBoundary>
	);
};
