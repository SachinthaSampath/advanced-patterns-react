import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";

import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import FollowButton from "@/features/user/components/UserFollowButton";
import UserList from "@/features/user/components/UserList";
import { isTRPCClientError, trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/followers")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async ({ context: { trpcQueryUtils }, params }) => {
    try {
      await trpcQueryUtils.users.followers.fetchInfinite({
        id: params.userId,
      });
    } catch (error) {
      if (isTRPCClientError(error) && error.data?.code === "NOT_FOUND") {
        throw notFound();
      }

      throw error;
    }
  },
  component: UserFollowers,
});

function UserFollowers() {
  const { userId } = Route.useParams();

  const [{ pages }, followersQuery] =
    trpc.users.followers.useSuspenseInfiniteQuery(
      { id: userId },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Followers</h1>

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
          users={pages.flatMap((page) => page.items)}
          isLoading={followersQuery.isFetchingNextPage}
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
