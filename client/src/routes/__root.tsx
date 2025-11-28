import { trpcQueryUtils } from "@/router";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import Navbar from "../features/shared/components/Navbar";
import { Toaster } from "../features/shared/components/ui/Toaster";

export type RouterAppContext = {
  trpcQueryUtils: typeof trpcQueryUtils;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: Root,
});

function Root() {
  return (
    <>
      <Toaster />
      <div className="flex justify-center gap-8 pb-8">
        <Navbar />
        <div className="min-h-screen w-full max-w-2xl">
          <header className="mb-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
            <h1 className="text-center text-xl font-bold">
              Advanced Patterns React
            </h1>
            <p className="text-center text-sm text-neutral-500">
              <b>
                <span className="dark:text-primary-500">Cosden</span> Solutions
              </b>
            </p>
          </header>
          <div className="space-y-4 p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
