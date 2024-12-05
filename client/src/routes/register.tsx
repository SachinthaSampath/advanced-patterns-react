import { createFileRoute } from "@tanstack/react-router";

import RegisterForm from "@/features/auth/components/RegisterForm";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="mb-4 text-2xl font-bold">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
