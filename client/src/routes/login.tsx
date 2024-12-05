import { createFileRoute } from "@tanstack/react-router";

import LoginForm from "@/features/auth/components/LoginForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="mb-4 text-2xl font-bold">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
