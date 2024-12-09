import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Navbar from "@/features/shared/components/Navbar";
import ThemeProvider from "@/features/shared/components/theme/ThemeProvider";
import { Toaster } from "@/features/shared/components/ui/Toaster";
import { trpcQueryUtils } from "@/router";

export interface RouterAppContext {
  trpcQueryUtils: typeof trpcQueryUtils;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: Root,
});

function Root() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Toaster />
      <div>
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="container mx-auto flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">Advanced React</h1>
            <Navbar />
          </div>
        </header>
        <RootRoutes />
        <TanStackRouterDevtools />
      </div>
    </ThemeProvider>
  );
}

function RootRoutes() {
  const { isFetched } = useCurrentUser();

  return !isFetched ? (
    <div className="flex h-screen items-center justify-center">Loading...</div>
  ) : (
    <Outlet />
  );
}
