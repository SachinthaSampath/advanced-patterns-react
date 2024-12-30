import { Experience, User } from "@advanced-react/server/database/schema";
import { useParams } from "@tanstack/react-router";
import { MessageSquare, Users } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import { useToast } from "@/features/shared/hooks/useToast";
import UserAvatar from "@/features/user/components/UserAvatar";
import { trpc } from "@/router";

type ExperienceCardProps = {
  experience: Experience & {
    commentsCount: number;
    user: User;
    attendeesCount: number;
    attendees: User[];
  };
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const { currentUser } = useCurrentUser();

  const isPostOwner = currentUser?.id === experience.userId;

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start gap-4">
        <Link to="/users/$userId" params={{ userId: experience.user.id }}>
          <UserAvatar user={experience.user} showName={false} />
        </Link>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1">
                <Link
                  variant="secondary"
                  to="/users/$userId"
                  params={{ userId: experience.user.id }}
                >
                  <span className="font-semibold">{experience.user.name}</span>
                </Link>
                <span className="text-sm text-neutral-500">·</span>
                <time className="text-sm text-neutral-500">
                  {new Date(experience.createdAt).toLocaleDateString()}
                </time>
              </div>
              <Link
                to="/experiences/$experienceId"
                params={{ experienceId: experience.id }}
                className="block hover:no-underline"
              >
                <h2 className="text-xl font-bold hover:underline">
                  {experience.title}
                </h2>
              </Link>
            </div>
            {isPostOwner && (
              <ExperienceCardOwnerButtons experience={experience} />
            )}
          </div>
          <p className="text-neutral-800 dark:text-neutral-100">
            {experience.content}
          </p>
          <ExperienceCardButtons experience={experience} />
        </div>
      </div>
    </article>
  );
}

type ExperienceCardButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardButtons({ experience }: ExperienceCardButtonsProps) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { userId: pathUserId } = useParams({ strict: false });

  const attendMutation = trpc.experiences.attend.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<
        T extends { attendeesCount: number; attendees: User[] },
      >(oldData: T) {
        return {
          ...oldData,
          attendeesCount: oldData.attendeesCount + 1,
          attendees: [currentUser, ...oldData.attendees],
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            experiences: page.experiences.map((e) =>
              e.id === experience.id ? updateExperience(e) : e,
            ),
          })),
        };
      });

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.map((e) =>
                  e.id === experience.id ? updateExperience(e) : e,
                ),
              })),
            };
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      toast({
        title: "Failed to attend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unattendMutation = trpc.experiences.unattend.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<
        T extends { attendeesCount: number; attendees: User[] },
      >(oldData: T) {
        return {
          ...oldData,
          attendeesCount: Math.max(0, oldData.attendeesCount - 1),
          attendees: oldData.attendees.filter((a) => a.id !== currentUser?.id),
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            experiences: page.experiences.map((e) =>
              e.id === experience.id ? updateExperience(e) : e,
            ),
          })),
        };
      });

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.map((e) =>
                  e.id === experience.id ? updateExperience(e) : e,
                ),
              })),
            };
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      toast({
        title: "Failed to unattend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAttending = experience.attendees.some(
    (attendee) => attendee.id === currentUser?.id,
  );

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <span>{experience.attendeesCount}</span>
      </div>

      <Button variant="link" asChild>
        <Link
          to="/experiences/$experienceId"
          params={{ experienceId: experience.id }}
          variant="ghost"
        >
          <MessageSquare className="h-5 w-5" />
          <span>{experience.commentsCount}</span>
        </Link>
      </Button>

      {currentUser && currentUser.id !== experience.userId && (
        <Button
          variant={isAttending ? "outline" : "default"}
          onClick={() => {
            if (isAttending) {
              unattendMutation.mutate({ id: experience.id });
            } else {
              attendMutation.mutate({ id: experience.id });
            }
          }}
          disabled={attendMutation.isPending || unattendMutation.isPending}
        >
          {isAttending ? "Unattend" : "Attend"}
        </Button>
      )}
    </div>
  );
}

type ExperienceCardOwnerButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardOwnerButtons({
  experience,
}: ExperienceCardOwnerButtonsProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { userId: pathUserId } = useParams({ strict: false });

  const deleteMutation = trpc.experiences.delete.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
      };

      utils.experiences.byId.reset({ id });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            experiences: page.experiences.filter((e) => e.id !== id),
          })),
        };
      });

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.filter((e) => e.id !== id),
              })),
            };
          },
        );
      }

      const { dismiss } = toast({
        title: "Experience deleted",
        description: "Your experience has been deleted",
      });

      return { dismiss, previousData };
    },
    onError: (error, { id }, context) => {
      context?.dismiss();

      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      toast({
        title: "Failed to delete experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex gap-2">
      <Button asChild variant="link">
        <Link
          to="/experiences/$experienceId/edit"
          params={{ experienceId: experience.id }}
        >
          Edit
        </Link>
      </Button>
      <Button
        variant="destructive-link"
        onClick={() => {
          if (
            window.confirm("Are you sure you want to delete this experience?")
          ) {
            deleteMutation.mutate({ id: experience.id });
          }
        }}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
