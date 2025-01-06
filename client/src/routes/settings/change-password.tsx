import { createFileRoute } from "@tanstack/react-router";

import { ChangePasswordForm } from "../../features/user/components/ChangePasswordForm";

export const Route = createFileRoute("/settings/change-password")({
  component: ChangePassword,
});

function ChangePassword() {
  return (
    <div className="container mx-auto max-w-lg py-8">
      <h1 className="mb-8 text-2xl font-bold">Change Password</h1>
      <ChangePasswordForm />
    </div>
  );
}
