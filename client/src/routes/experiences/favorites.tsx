import { createFileRoute, redirect } from "@tanstack/react-router";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/favorites")({
  component: FavoritesPage,
  loader: async ({ context: { trpcQueryUtils } }) => {
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    if (!currentUser) {
      return redirect({ to: "/login" });
    }

    await trpcQueryUtils.experiences.favorites.prefetchInfinite({});
  },
});

function FavoritesPage() {
  const [{ pages }, experiencesQuery] =
    trpc.experiences.favorites.useSuspenseInfiniteQuery(
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
          isLoading={
            experiencesQuery.isLoading || experiencesQuery.isFetchingNextPage
          }
        />
      </InfiniteScroll>
    </main>
  );
}
