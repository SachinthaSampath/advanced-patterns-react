import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import Navbar from "@/features/shared/components/Navbar";
import ThemeProvider from "@/features/shared/components/theme/ThemeProvider";
import TopLoadingBar from "@/features/shared/components/TopLoadingBar";
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
          <TopLoadingBar />
          <div className="container mx-auto flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">Advanced React</h1>
            <Navbar />
          </div>
        </header>
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </ThemeProvider>
  );
}
