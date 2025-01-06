import { Edit, Home, LogOut, Search, User } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import ThemeToggle from "@/features/shared/components/theme/ThemeToggle";
import Link from "@/features/shared/components/ui/Link";
import UserAvatar from "@/features/user/components/UserAvatar";
import { router, trpc } from "@/router";

import { useToast } from "../hooks/useToast";
import Button from "./ui/Button";

export default function Navigation() {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();

  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.currentUser.invalidate();

      router.navigate({ to: "/login" });

      toast({
        title: "Logged out",
        description: "You have been logged out",
      });
    },
  });

  return (
    <nav className="flex w-64 flex-col gap-4 pt-8">
      {currentUser && (
        <Link
          to="/users/$userId"
          params={{ userId: currentUser.id }}
          variant="ghost"
          activeProps={{ className: undefined }}
        >
          <UserAvatar
            user={currentUser}
            showName={false}
            className="h-16 w-16"
          />
        </Link>
      )}

      <Link
        to="/"
        variant="ghost"
        className="flex items-center gap-2 rounded-lg p-2 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Home className="h-6 w-6" />
        Home
      </Link>

      <Link
        to="/search"
        variant="ghost"
        className="flex items-center gap-2 rounded-lg p-2 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Search className="h-6 w-6" />
        Search
      </Link>

      {currentUser && (
        <Link
          to="/users/$userId"
          params={{ userId: currentUser.id }}
          variant="ghost"
          className="flex items-center gap-2 rounded-lg p-2 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <User className="h-6 w-6" />
          Profile
        </Link>
      )}

      {currentUser ? (
        <Button
          variant="destructive-link"
          className="justify-start p-3"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-6 w-6" />
          Logout
        </Button>
      ) : (
        <Link
          to="/login"
          variant="ghost"
          className="flex items-center gap-2 rounded-lg p-2 text-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <User className="h-6 w-6" />
          Sign in
        </Link>
      )}

      <ThemeToggle />

      {currentUser && (
        <Link
          to="/experiences/$experienceId/edit"
          params={{ experienceId: 0 }}
          variant="ghost"
          asChild
        >
          <Button>
            <Edit className="h-6 w-6" />
            Create Experience
          </Button>
        </Link>
      )}
    </nav>
  );
}
