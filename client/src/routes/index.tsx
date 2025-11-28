import { createFileRoute } from "@tanstack/react-router";

import { trpc } from "@/router";
import { InfiniteScroll } from "@/features/shared/components/InfiniteScroll";
import { ExperienceList } from "@/features/experience/components/ExperienceList";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } =
    trpc.experiences.feed.useInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );
  return (
    <InfiniteScroll
      onLoadMore={() => fetchNextPage()}
      hasNextPage={hasNextPage}
    >
      <ExperienceList
        experiences={data?.pages.flatMap((page) => page.experiences) ?? []}
        isLoading={isLoading || isFetchingNextPage}
      />
    </InfiniteScroll>
  );
}
