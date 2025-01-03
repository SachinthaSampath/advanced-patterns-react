import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/router";

export const Route = createFileRoute("/tags/$tagId/")({
  params: {
    parse: (params) => ({
      tagId: z.coerce.number().parse(params.tagId),
    }),
  },
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await Promise.all([
      trpcQueryUtils.tags.byId.ensureData({ id: params.tagId }),
      // TODO: This currently doesn't work due to a bug in TRPC
      // https://github.com/trpc/trpc/discussions/5833
      // trpcQueryUtils.tags.experiences.ensureData({ id: params.tagId }),
    ]);
  },
  component: TagPage,
});

function TagPage() {
  const { tagId } = Route.useParams();

  const tagQuery = trpc.tags.byId.useQuery({ id: tagId });

  const experiencesQuery = trpc.tags.experiences.useInfiniteQuery(
    {
      id: tagId,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (tagQuery.isLoading || experiencesQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (!tagQuery.data) {
    return <div>Tag not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto flex flex-col gap-4">
        <h2 className="text-2xl font-bold">
          Experiences with "{tagQuery.data.name}"
        </h2>
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
