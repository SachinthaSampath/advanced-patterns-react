import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import FollowButton from "@/features/user/components/FollowButton";
import UserList from "@/features/user/components/UserList";
import { trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/following")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async () => {
    // TODO: This currently doesn't work due to a bug in TRPC
    // https://github.com/trpc/trpc/discussions/5833
    // await trpcQueryUtils.users.following.ensureData({ userId: params.userId });
  },
  component: UserFollowing,
});

function UserFollowing() {
  const { userId } = Route.useParams();

  const followingQuery = trpc.users.following.useInfiniteQuery(
    { id: userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (followingQuery.error) {
    return <QueryErrorFallback refetch={followingQuery.refetch} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-8 text-2xl font-bold">Following</h1>

        <InfiniteScroll
          onLoadMore={() => {
            if (
              followingQuery.hasNextPage &&
              !followingQuery.isFetchingNextPage
            ) {
              followingQuery.fetchNextPage();
            }
          }}
          hasNextPage={followingQuery.hasNextPage}
        >
          <UserList
            users={
              followingQuery.data?.pages.flatMap((page) => page.items) ?? []
            }
            isLoading={
              followingQuery.isLoading || followingQuery.isFetchingNextPage
            }
            rightComponent={(user) => (
              <FollowButton
                targetUserId={user.id}
                isFollowing={user.isFollowing}
              />
            )}
          />
        </InfiniteScroll>
      </div>
    </div>
  );
}
