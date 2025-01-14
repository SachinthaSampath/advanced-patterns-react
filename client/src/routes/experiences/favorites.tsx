import { createFileRoute } from "@tanstack/react-router";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const experiencesQuery = trpc.experiences.favorites.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Favorite Experiences</h1>
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
            experiences={
              experiencesQuery.data?.pages.flatMap(
                (page) => page.experiences,
              ) ?? []
            }
            isLoading={
              experiencesQuery.isLoading || experiencesQuery.isFetchingNextPage
            }
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
