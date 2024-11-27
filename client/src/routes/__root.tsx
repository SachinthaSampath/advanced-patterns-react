import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import ThemeProvider from "@/features/shared/components/theme/ThemeProvider";
import ThemeToggle from "@/features/shared/components/theme/ThemeToggle";
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
      <div>
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="container mx-auto flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">Advanced React</h1>
            <ThemeToggle />
          </div>
        </header>
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </ThemeProvider>
  );
}
