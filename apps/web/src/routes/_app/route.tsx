import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { userQueryOptions } from "@/api/auth/auth.hook";
import { AppHeader } from "@/components/layout/app-header.component";
import { AppSidebar } from "@/components/layout/app-sidebar.component";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const { queryClient } = context;
		const user = await queryClient.fetchQuery(userQueryOptions);
		if (!user) {
			throw redirect({
				to: "/auth/signin",
				search: {
					redirect: location.href,
				},
			});
		}
	},
});

function RouteComponent() {
	return (
		<div className="flex h-screen w-full overflow-hidden">
			<AppSidebar />
			<div className="flex flex-1 flex-col">
				<AppHeader />
				<main className="flex-1 overflow-y-auto p-2">
					<Outlet />
					<Toaster richColors position="bottom-right" />
				</main>
			</div>
		</div>
	);
}
