import { createFileRoute } from "@tanstack/react-router";
import { useTransactions } from "@/api/transactions";
import { QueryBoundary } from "@/components/common/boundry/query-boundry";

export const Route = createFileRoute("/_app/transaction/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: txns } = useTransactions();
  return (
    <QueryBoundary>
      <div>
        {txns.transactions.map((x) => (
          <div key={x.id} className="flex flex-row gap-4">
            <span>{x.description}</span>
            <span>{x.entry?.amount}</span>
            <span>{x.createdAt}</span>
            <span>{x.entry?.transactionAccount?.name}</span>
          </div>
        ))}
      </div>
    </QueryBoundary>
  );
}
