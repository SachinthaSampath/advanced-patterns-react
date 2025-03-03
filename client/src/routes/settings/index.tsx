import { createFileRoute, redirect } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Button } from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { ChangeEmailDialog } from "@/features/user/components/ChangeEmailDialog";
import { ChangePasswordDialog } from "@/features/user/components/ChangePasswordDialog";
import { router, trpc } from "@/router";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
  loader: async ({ context: { trpcQueryUtils } }) => {
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    if (!currentUser) {
      return redirect({ to: "/login" });
    }
  },
});

function SettingsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { currentUser } = useCurrentUser();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.currentUser.invalidate();

      await utils.notifications.feed.reset();
      await utils.experiences.favorites.reset();

      router.navigate({ to: "/login" });

      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
  });

  const settings = [
    {
      label: currentUser?.email,
      component: <ChangeEmailDialog />,
    },
    {
      label: "Change your password",
      component: <ChangePasswordDialog />,
    },
    {
      label: "Sign out of your account",
      component: (
        <Button
          variant="destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      ),
    },
  ];

  return (
    <main className="space-y-4">
      {settings.map((setting) => (
        <div
          key={setting.label}
          className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span className="text-neutral-600 dark:text-neutral-400">
            {setting.label}
          </span>
          {setting.component}
        </div>
      ))}
    </main>
  );
}
