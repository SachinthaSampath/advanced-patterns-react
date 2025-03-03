import { experienceFiltersSchema } from "@advanced-react/shared/schema/experience";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import ExperienceFilters from "@/features/experience/components/ExperienceFilters";
import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/search")({
  component: Search,
  validateSearch: experienceFiltersSchema,
  loader: async ({ context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.tags.list.ensureData();
  },
});

function Search() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const experiencesQuery = trpc.experiences.search.useInfiniteQuery(
    {
      ...search,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!search.q || !!search.scheduledAt || !!search.tags,
    },
  );

  return (
    <main className="space-y-4">
      <ExperienceFilters
        onFiltersChange={(filters) => {
          navigate({
            search: filters,
          });
        }}
        initialFilters={search}
      />
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
            experiencesQuery.data?.pages.flatMap((page) => page.experiences) ??
            []
          }
          isLoading={
            experiencesQuery.isLoading || experiencesQuery.isFetchingNextPage
          }
          noExperiencesMessage={
            !!search.q || !!search.scheduledAt || !!search.tags
              ? "No experiences found"
              : "Search to find experiences"
          }
        />
      </InfiniteScroll>
    </main>
  );
}
