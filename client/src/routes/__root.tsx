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
      <div className="flex justify-center">
        <Navbar />
        <div className="min-h-screen w-full max-w-3xl">
          <TopLoadingBar />
          <header className="border-b border-neutral-200 p-4 dark:border-neutral-800">
            <h1 className="text-center text-xl font-bold">Advanced React</h1>
          </header>
          <Outlet />
          <TanStackRouterDevtools />
        </div>
      </div>
    </ThemeProvider>
  );
}
