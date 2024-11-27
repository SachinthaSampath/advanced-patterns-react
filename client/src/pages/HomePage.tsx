import { useCallback, useMemo } from "react";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/lib/trpc";

export default function HomePage() {
  const experiencesQuery = trpc.experiences.feed.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  const handleLoadMore = useCallback(() => {
    if (experiencesQuery.hasNextPage && !experiencesQuery.isFetchingNextPage) {
      experiencesQuery.fetchNextPage();
    }
  }, [experiencesQuery]);

  const experiences = useMemo(() => {
    return (
      experiencesQuery.data?.pages.flatMap((page) => page.experiences) ?? []
    );
  }, [experiencesQuery.data]);

  if (experiencesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 max-w-feed mx-auto">
        <InfiniteScroll
          onLoadMore={handleLoadMore}
          hasNextPage={experiencesQuery.hasNextPage}
        >
          <ExperienceList
            experiences={experiences}
            isLoading={experiencesQuery.isFetchingNextPage}
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
