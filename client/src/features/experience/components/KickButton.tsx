import { Experience, User } from "@advanced-react/server/database/schema";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import { trpc } from "@/router";

type KickButtonProps = {
  experienceId: Experience["id"];
  userId: User["id"];
};

export default function KickButton({ experienceId, userId }: KickButtonProps) {
  const utils = trpc.useUtils();
  const { currentUser } = useCurrentUser();

  const kickMutation = trpc.experiences.kickAttendee.useMutation({
    onMutate: async () => {
      await utils.experiences.attendees.cancel();

      const prevData = utils.experiences.attendees.getInfiniteData({
        experienceId,
      });

      utils.experiences.attendees.setInfiniteData({ experienceId }, (old) => {
        if (!old) {
          return {
            pages: [],
            pageParams: [],
          };
        }

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            attendees: page.attendees.filter(
              (attendee) => attendee.id !== userId,
            ),
            attendeesCount: page.attendeesCount - 1,
          })),
        };
      });

      return { prevData };
    },
    onError: (_, __, context) => {
      if (context?.prevData) {
        utils.experiences.attendees.setInfiniteData(
          { experienceId },
          context.prevData,
        );
      }
    },
  });

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant="destructive-link"
      onClick={() => {
        if (window.confirm("Are you sure you want to kick this attendee?")) {
          kickMutation.mutate({ experienceId, userId });
        }
      }}
      disabled={kickMutation.isPending}
    >
      Kick
    </Button>
  );
}
