import { Experience, User } from "@advanced-react/server/database/schema";
import { MessageSquare, Users } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import { useToast } from "@/features/shared/hooks/useToast";
import UserAvatar from "@/features/user/components/UserAvatar";
import { trpc } from "@/router";

import { getExperienceQueries } from "../utils/mutations";

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

  const isAttending = experience.attendees.some(
    (attendee) => attendee.id === currentUser?.id,
  );

  const attendMutation = trpc.experiences.attend.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      const { feed, byId } = getExperienceQueries(utils);

      await Promise.all([
        ...feed.map((query) => query.cancel()),
        ...byId.map((query) => query.cancel()),
      ]);

      const previousData = {
        feed: feed.map((query) => ({
          query,
          data: query.getData(),
        })),
        byId: byId.map((query) => ({
          query,
          data: query.getData({ id: experience.id }),
        })),
      };

      feed.forEach((query) =>
        query.setInfiniteData({}, (oldData) => {
          if (!oldData) {
            return { pages: [], pageParams: [] };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              experiences: page.experiences.map((e) =>
                e.id === experience.id
                  ? {
                      ...e,
                      attendeesCount: e.attendeesCount + 1,
                      attendees: [currentUser, ...e.attendees],
                    }
                  : e,
              ),
            })),
          };
        }),
      );

      byId.forEach((query) =>
        query.setData({ id: experience.id }, (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            attendeesCount: oldData.attendeesCount + 1,
            attendees: [currentUser, ...oldData.attendees],
          };
        }),
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      context?.previousData.feed.forEach(({ query, data }) => {
        query.setData({}, data);
      });

      context?.previousData.byId.forEach(({ query, data }) => {
        query.setData({ id: experience.id }, data);
      });

      toast({
        title: "Failed to attend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unattendMutation = trpc.experiences.unattend.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      const { feed, byId } = getExperienceQueries(utils);

      await Promise.all([
        feed.map((query) => query.cancel()),
        byId.map((query) => query.cancel()),
      ]);

      const previousData = {
        feed: feed.map((query) => ({
          query,
          data: query.getData(),
        })),
        byId: byId.map((query) => ({
          query,
          data: query.getData({ id: experience.id }),
        })),
      };

      feed.forEach((query) =>
        query.setInfiniteData({}, (oldData) => {
          if (!oldData) {
            return { pages: [], pageParams: [] };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              experiences: page.experiences.map((e) =>
                e.id === experience.id
                  ? {
                      ...e,
                      attendeesCount: e.attendeesCount - 1,
                      attendees: e.attendees.filter(
                        (a) => a.id !== currentUser.id,
                      ),
                    }
                  : e,
              ),
            })),
          };
        }),
      );

      byId.forEach((query) =>
        query.setData({ id: experience.id }, (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            attendeesCount: oldData.attendeesCount - 1,
            attendees: oldData.attendees.filter((a) => a.id !== currentUser.id),
          };
        }),
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      context?.previousData.feed.forEach(({ query, data }) => {
        query.setData({}, data);
      });

      context?.previousData.byId.forEach(({ query, data }) => {
        query.setData({ id: experience.id }, data);
      });

      toast({
        title: "Failed to unattend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const deleteMutation = trpc.experiences.delete.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.experiences.feed.cancel(),
        utils.experiences.byId.cancel(),
      ]);

      const previousExperience = utils.experiences.byId.getData({
        id: experience.id,
      });

      const previousPages = utils.experiences.feed.getInfiniteData();

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

      utils.experiences.byId.setData({ id }, undefined);

      const { dismiss } = toast({
        title: "Experience deleted",
        description: "Your experience has been deleted",
      });

      return { dismiss, previousPages, previousExperience };
    },
    onSuccess: async () => {
      await Promise.all([
        utils.experiences.feed.invalidate(),
        utils.experiences.byId.invalidate(),
      ]);
    },
    onError: (error, _, context) => {
      context?.dismiss();

      utils.experiences.feed.setInfiniteData({}, context?.previousPages);

      utils.experiences.byId.setData(
        { id: experience.id },
        context?.previousExperience,
      );

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
