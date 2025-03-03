// Built on top of https://github.com/TanStack/router/blob/main/examples/react/with-trpc-react-query/app/router.tsx

import { AppRouter } from "@advanced-react/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
  httpLink,
  isNonJsonSerializable,
  splitLink,
  TRPCClientError,
  TRPCLink,
} from "@trpc/client";
import { httpBatchLink } from "@trpc/client";
import {
  createTRPCQueryUtils,
  createTRPCReact,
  getQueryKey,
} from "@trpc/react-query";
import { observable } from "@trpc/server/observable";

import { env } from "@/lib/utils/env";

import { ErrorComponent } from "./features/shared/components/ErrorComponent";
import { NotFoundComponent } from "./features/shared/components/NotFoundComponent";
import { routeTree } from "./routeTree.gen";

export const queryClient = new QueryClient();

export const trpc = createTRPCReact<AppRouter>();

export const customLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },

        error(err) {
          if (err?.data?.code === "UNAUTHORIZED") {
            router.navigate({ to: "/login" });
          }

          observer.error(err);
        },

        complete() {
          observer.complete();
        },
      });

      return unsubscribe;
    });
  };
};

function getHeaders() {
  const queryKey = getQueryKey(trpc.auth.currentUser);
  const token = queryClient.getQueryData<{ accessToken: string }>(
    queryKey,
  )?.accessToken;

  return {
    Authorization: token ? `Bearer ${token}` : undefined,
  };
}

export const trpcClient = trpc.createClient({
  links: [
    customLink,
    splitLink({
      condition(op) {
        return isNonJsonSerializable(op.input);
      },
      true: httpLink({
        url: env.VITE_SERVER_BASE_URL,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
        headers: getHeaders(),
      }),
      false: httpBatchLink({
        url: env.VITE_SERVER_BASE_URL,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
        headers: getHeaders(),
      }),
    }),
  ],
});

export const trpcQueryUtils = createTRPCQueryUtils({
  queryClient,
  client: trpcClient,
});

function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: ErrorComponent,
    defaultNotFoundComponent: NotFoundComponent,
    context: {
      trpcQueryUtils,
    },
    Wrap: function WrapComponent({ children }) {
      return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  });

  return router;
}

// Set up a Router instance
export const router = createRouter();

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}

export function isTRPCClientError(
  cause: unknown,
): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}
