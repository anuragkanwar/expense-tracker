import { createFileRoute } from "@tanstack/react-router";
import { ChartBarInteractive } from "@/features/dashboard/charts/expense-overview.chart";
import { MonthlyOverview } from "@/features/dashboard/charts/monthly-overview.chart";

export const Route = createFileRoute("/_app/dashboard/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="min-h-full">
			<div className="grid grid-cols-3 gap-4">
				<ChartBarInteractive />
				<MonthlyOverview />
				<MonthlyOverview />
				<MonthlyOverview />
			</div>
		</div>
	);
}
