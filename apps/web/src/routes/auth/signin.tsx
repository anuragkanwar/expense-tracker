import { createFileRoute, Link } from "@tanstack/react-router";
import { Wand } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const Route = createFileRoute("/auth/signin")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 w-full">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Wand className="size-4" />
          </div>
          Pocket Pixie
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
