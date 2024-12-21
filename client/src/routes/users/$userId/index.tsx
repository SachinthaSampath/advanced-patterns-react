import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import UserAvatar from "@/features/user/components/UserAvatar";
import { trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await Promise.all([
      trpcQueryUtils.users.byId.ensureData({ id: params.userId }),
      // TODO: This currently doesn't work due to a bug in TRPC
      // https://github.com/trpc/trpc/discussions/5833
      // trpcQueryUtils.users.experiences.ensureData({ userId: params.userId }),
    ]);
  },
  component: UserProfile,
});

function UserProfile() {
  const { userId } = Route.useParams();

  const userQuery = trpc.users.byId.useQuery({ id: userId });

  const experiencesQuery = trpc.users.experiences.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (userQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (userQuery.error) {
    return <QueryErrorFallback refetch={userQuery.refetch} />;
  }

  if (!userQuery.data) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <UserAvatar user={userQuery.data} showName={false} />
          <h1 className="text-2xl font-bold">{userQuery.data.name}</h1>
        </div>

        <h2 className="mb-4 text-xl font-semibold">Experiences</h2>

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
