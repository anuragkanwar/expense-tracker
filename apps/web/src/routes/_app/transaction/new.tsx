import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/transaction/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/transaction/new"!</div>;
}
