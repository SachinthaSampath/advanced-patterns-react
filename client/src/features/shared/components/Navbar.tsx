import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import ThemeToggle from "@/features/shared/components/theme/ThemeToggle";
import Button from "@/features/shared/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/shared/components/ui/DropdownMenu";
import { router, trpc } from "@/router";

import { useToast } from "../hooks/useToast";

export default function Navbar() {
  const { toast } = useToast();
  const { currentUser, isFetched } = useCurrentUser();

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
    <div className="flex items-center gap-4">
      {isFetched &&
        (currentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="outline-none">
              <Button variant="outline" className="gap-2 font-normal">
                <User className="h-4 w-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  to="/users/$userId"
                  params={{ userId: currentUser.id }}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await logoutMutation.mutateAsync();
                  } catch (error) {
                    console.error(error);
                  }
                }}
                disabled={logoutMutation.isPending}
                className="text-red-500 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login">Login</Link>
        ))}
      <ThemeToggle />
    </div>
  );
}
