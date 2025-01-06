import { createFileRoute } from "@tanstack/react-router";

import NotificationList from "@/features/notification/components/NotificationList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

function Notifications() {
  const notificationsQuery = trpc.notifications.feed.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
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
            notifications={
              notificationsQuery.data?.pages.flatMap(
                (page) => page.notifications,
              ) ?? []
            }
            isLoading={
              notificationsQuery.isLoading ||
              notificationsQuery.isFetchingNextPage
            }
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
