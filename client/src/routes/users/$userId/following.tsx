import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";

import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import FollowButton from "@/features/user/components/UserFollowButton";
import UserList from "@/features/user/components/UserList";
import { isTRPCClientError, trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/following")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    try {
      await trpcQueryUtils.users.following.fetchInfinite({
        id: params.userId,
      });
    } catch (error) {
      if (isTRPCClientError(error) && error.data?.code === "NOT_FOUND") {
        throw notFound();
      }
    }
  },
  component: UserFollowing,
});

function UserFollowing() {
  const { userId } = Route.useParams();

  const [{ pages }, followingQuery] =
    trpc.users.following.useSuspenseInfiniteQuery(
      { id: userId },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Following</h1>

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
          users={pages.flatMap((page) => page.items)}
          isLoading={followingQuery.isFetchingNextPage}
          rightComponent={(user) => (
            <FollowButton
              targetUserId={user.id}
              isFollowing={user.isFollowing}
            />
          )}
        />
      </InfiniteScroll>
    </main>
  );
}
