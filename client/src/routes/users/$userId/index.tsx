import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import Link from "@/features/shared/components/ui/Link";
import FollowButton from "@/features/user/components/FollowButton";
import UserAvatar from "@/features/user/components/UserAvatar";
import { RouterOutputs, trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await Promise.all([
      trpcQueryUtils.users.byId.ensureData({ id: params.userId }),
      // TODO: This currently doesn't work due to a bug in TRPC
      // https://github.com/trpc/trpc/discussions/5833
      // trpcQueryUtils.users.experiences.ensureData({ id: params.userId }),
    ]);
  },
  component: UserProfile,
});

function UserProfile() {
  const { userId } = Route.useParams();

  const userQuery = trpc.users.byId.useQuery({ id: userId });

  const experiencesQuery = trpc.users.experiences.useInfiniteQuery(
    { id: userId },
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
        <div className="mb-8">
          <div className="mb-6 flex flex-col items-center">
            <UserAvatar
              user={userQuery.data}
              showName={false}
              className="h-24 w-24"
            />
            <h1 className="mt-4 text-3xl font-bold">{userQuery.data.name}</h1>
          </div>

          <UserProfileStats user={userQuery.data} />
        </div>

        <div className="flex justify-center">
          <FollowButton
            targetUserId={userQuery.data.id}
            isFollowing={userQuery.data.isFollowing}
          />
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

type UserProfileStatsProps = {
  user: RouterOutputs["users"]["byId"];
};

function UserProfileStats({ user }: UserProfileStatsProps) {
  return (
    <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <div className="mb-4 flex justify-center gap-12">
        <Link
          to="/users/$userId/followers"
          params={{ userId: user.id }}
          className="text-center"
        >
          <div className="text-center text-2xl font-bold">
            {user.followersCount}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Followers
          </div>
        </Link>

        <Link
          to="/users/$userId/following"
          params={{ userId: user.id }}
          className="text-center"
        >
          <div className="text-center text-2xl font-bold">
            {user.followingCount}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Following
          </div>
        </Link>
      </div>
    </div>
  );
}
