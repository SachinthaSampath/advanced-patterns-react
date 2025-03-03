import { createFileRoute, notFound } from "@tanstack/react-router";
import { MartiniIcon } from "lucide-react";
import { z } from "zod";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import ExperienceList from "@/features/experience/components/ExperienceList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import Card from "@/features/shared/components/ui/Card";
import Link from "@/features/shared/components/ui/Link";
import UserAvatar from "@/features/user/components/UserAvatar";
import { UserEditDialog } from "@/features/user/components/UserEditDialog";
import UserFollowButton from "@/features/user/components/UserFollowButton";
import { UserEnhanced } from "@/features/user/types";
import { isTRPCClientError, trpc } from "@/router";

export const Route = createFileRoute("/users/$userId/")({
  parseParams: (params) => ({
    userId: z.coerce.number().parse(params.userId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    try {
      await trpcQueryUtils.users.byId.ensureData({
        id: params.userId,
      });
    } catch (error) {
      if (isTRPCClientError(error) && error.data?.code === "NOT_FOUND") {
        throw notFound();
      }

      throw error;
    }
  },
  component: UserProfile,
});

function UserProfile() {
  const { userId } = Route.useParams();

  const [user] = trpc.users.byId.useSuspenseQuery({ id: userId });

  const experiencesQuery = trpc.experiences.byUserId.useInfiniteQuery(
    { id: userId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  return (
    <main className="space-y-4">
      <Card className="flex flex-col items-center gap-4 px-0">
        <UserAvatar user={user} showName={false} className="h-24 w-24" />
        <h1 className="text-3xl font-bold">{user.name}</h1>
        {user.bio && (
          <p className="text-neutral-600 dark:text-neutral-400">{user.bio}</p>
        )}

        <UserProfileStats user={user} />
        <UserProfileButton user={user} />
      </Card>

      <UserProfileHostStats user={user} />

      <h2 className="text-2xl font-bold">Experiences</h2>
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
        />
      </InfiniteScroll>
    </main>
  );
}

type UserProfileStatsProps = {
  user: UserEnhanced;
};

function UserProfileStats({ user }: UserProfileStatsProps) {
  const stats = [
    {
      label: "Followers",
      value: user.followersCount,
      href: `/users/${user.id}/followers`,
    },
    {
      label: "Following",
      value: user.followingCount,
      href: `/users/${user.id}/following`,
    },
  ];

  return (
    <div className="flex w-full justify-center gap-12 border-y-2 border-neutral-200 py-4 dark:border-neutral-800">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          variant="ghost"
          className="text-center"
        >
          <div className="dark:text-primary-500 text-secondary-500 text-center text-2xl font-bold">
            {stat.value}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {stat.label}
          </div>
        </Link>
      ))}
    </div>
  );
}

type UserProfileButtonProps = {
  user: UserEnhanced;
};

function UserProfileButton({ user }: UserProfileButtonProps) {
  const { currentUser } = useCurrentUser();
  const isCurrentUser = currentUser?.id === user.id;

  return isCurrentUser ? (
    <UserEditDialog user={user} />
  ) : (
    <UserFollowButton targetUserId={user.id} isFollowing={user.isFollowing} />
  );
}

type UserProfileHostStatsProps = {
  user: UserEnhanced;
};

function UserProfileHostStats({ user }: UserProfileHostStatsProps) {
  return (
    <Card className="space-y-2">
      <h3 className="text-center text-lg font-semibold">Host Stats</h3>
      <div className="flex flex-row items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
        <MartiniIcon className="h-5 w-5" />
        {user.hostedExperiencesCount}
      </div>
    </Card>
  );
}
