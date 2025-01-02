import { experienceFiltersSchema } from "@advanced-react/shared/schema/experience";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import ExperienceFilters from "@/features/experience/components/ExperienceFilters";
import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: experienceFiltersSchema,
});

function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const experiencesQuery = trpc.experiences.feed.useInfiniteQuery(
    {
      ...search,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto flex flex-col gap-4">
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
