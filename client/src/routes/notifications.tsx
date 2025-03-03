import { createFileRoute, redirect } from "@tanstack/react-router";

import NotificationList from "@/features/notification/components/NotificationList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
  loader: async ({ context: { trpcQueryUtils } }) => {
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    if (!currentUser) {
      return redirect({ to: "/login" });
    }

    await trpcQueryUtils.notifications.feed.prefetchInfinite({});
  },
});

function Notifications() {
  const [{ pages }, notificationsQuery] =
    trpc.notifications.feed.useSuspenseInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <main className="flex flex-col gap-4">
      <InfiniteScroll
        onLoadMore={() => {
          if (
            notificationsQuery.hasNextPage &&
            !notificationsQuery.isFetchingNextPage
          ) {
            notificationsQuery.fetchNextPage();
          }
        }}
        hasNextPage={notificationsQuery.hasNextPage}
      >
        <NotificationList
          notifications={pages.flatMap((page) => page.notifications)}
          isLoading={notificationsQuery.isFetchingNextPage}
        />
      </InfiniteScroll>
    </main>
  );
}
