import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import UserList from "@/features/user/components/UserList";
import { trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/followers")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async () => {
    // TODO: This currently doesn't work due to a bug in TRPC
    // https://github.com/trpc/trpc/discussions/5833
    // await trpcQueryUtils.users.followers.ensureData({ userId: params.userId });
  },
  component: UserFollowers,
});

function UserFollowers() {
  const { userId } = Route.useParams();

  const followersQuery = trpc.users.followers.useInfiniteQuery(
    { userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (followersQuery.error) {
    return <QueryErrorFallback refetch={followersQuery.refetch} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-8 text-2xl font-bold">Followers</h1>

        <InfiniteScroll
          onLoadMore={() => {
            if (
              followersQuery.hasNextPage &&
              !followersQuery.isFetchingNextPage
            ) {
              followersQuery.fetchNextPage();
            }
          }}
          hasNextPage={followersQuery.hasNextPage}
        >
          <UserList
            users={
              followersQuery.data?.pages.flatMap((page) => page.items) ?? []
            }
            isLoading={
              followersQuery.isLoading || followersQuery.isFetchingNextPage
            }
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
