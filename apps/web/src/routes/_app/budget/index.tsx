import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/budget/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/budget/"!</div>;
}
