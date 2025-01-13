import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import KickButton from "@/features/experience/components/KickButton";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import FollowButton from "@/features/user/components/FollowButton";
import UserList from "@/features/user/components/UserList";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/$experienceId/attendees")({
  parseParams: (params) => ({
    experienceId: z.coerce.number().parse(params.experienceId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.experiences.byId.ensureData({
      id: params.experienceId,
    });

    // TODO: This currently doesn't work due to a bug in TRPC
    // https://github.com/trpc/trpc/discussions/5833
    // await trpcQueryUtils.experiences.attendees.ensureData({ experienceId: params.experienceId });
  },
  component: ExperienceAttendees,
});

function ExperienceAttendees() {
  const { experienceId } = Route.useParams();
  const { currentUser } = useCurrentUser();

  const experienceQuery = trpc.experiences.byId.useQuery({
    id: experienceId,
  });

  const attendeesQuery = trpc.experiences.attendees.useInfiniteQuery(
    { experienceId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (attendeesQuery.isPending || experienceQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (attendeesQuery.error || experienceQuery.error) {
    return (
      <QueryErrorFallback
        refetch={() => {
          attendeesQuery.refetch();
          experienceQuery.refetch();
        }}
      />
    );
  }

  const experience = experienceQuery.data;
  const isOwner = currentUser?.id === experience.userId;
  const totalAttendees = attendeesQuery.data.pages[0].attendeesCount;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto space-y-4">
        <h1 className="text-2xl font-bold">
          Attendees for "{experience.title}"
        </h1>
        <div>
          <h2 className="mb-2 font-medium">Attendees ({totalAttendees})</h2>
          <InfiniteScroll
            onLoadMore={() => {
              if (
                attendeesQuery.hasNextPage &&
                !attendeesQuery.isFetchingNextPage
              ) {
                attendeesQuery.fetchNextPage();
              }
            }}
            hasNextPage={attendeesQuery.hasNextPage}
          >
            <UserList
              users={attendeesQuery.data.pages.flatMap(
                (page) => page.attendees,
              )}
              isLoading={
                attendeesQuery.isLoading || attendeesQuery.isFetchingNextPage
              }
              rightComponent={(user) => (
                <div className="flex items-center gap-2">
                  <FollowButton
                    targetUserId={user.id}
                    isFollowing={user.isFollowing}
                  />
                  {isOwner && (
                    <KickButton experienceId={experienceId} userId={user.id} />
                  )}
                </div>
              )}
            />
          </InfiniteScroll>
        </div>
      </div>
    </div>
  );
}
