import { createFileRoute } from "@tanstack/react-router";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.experiences.feed.prefetchInfinite({});
  },
});

function Index() {
  const [{ pages }, experiencesQuery] =
    trpc.experiences.feed.useSuspenseInfiniteQuery(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <main className="space-y-4">
      <InfiniteScroll
        onLoadMore={() => {
          if (
            experiencesQuery.hasNextPage &&
            !experiencesQuery.isFetchingNextPage
          ) {
            experiencesQuery.fetchNextPage();
          }
        }}
        hasNextPage={experiencesQuery.hasNextPage}
      >
        <ExperienceList
          experiences={pages.flatMap((page) => page.experiences)}
          isLoading={experiencesQuery.isFetchingNextPage}
        />
      </InfiniteScroll>
    </main>
  );
}
