import { createFileRoute } from "@tanstack/react-router";

import { ChangeEmailForm } from "../../features/user/components/ChangeEmailForm";

export const Route = createFileRoute("/settings/change-email")({
  component: ChangeEmail,
});

function ChangeEmail() {
  return (
    <div className="container mx-auto max-w-lg py-8">
      <h1 className="mb-8 text-2xl font-bold">Change Email</h1>
      <ChangeEmailForm />
    </div>
  );
}
