import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";

import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import { useToast } from "@/features/shared/hooks/useToast";
import { router, trpc } from "@/router";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.invalidate();

      router.navigate({ to: "/login" });

      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
  });

  return (
    <div className="container mx-auto max-w-lg py-8">
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/settings/change-email"
          variant="ghost"
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 text-lg hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Change Email
        </Link>

        <Link
          to="/settings/change-password"
          variant="ghost"
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 text-lg hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Change Password
        </Link>

        <Button
          variant="destructive-link"
          disabled={logoutMutation.isPending}
          className="justify-start rounded-lg border border-neutral-200 p-4 text-lg hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-6 w-6" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
