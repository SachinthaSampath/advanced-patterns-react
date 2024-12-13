import { Experience, User } from "@advanced-react/server/database/schema";
import { MessageSquare } from "lucide-react";

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
  };
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const { currentUser } = useCurrentUser();

  const isPostOwner = currentUser?.id === experience.userId;

  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start gap-4">
        <UserAvatar user={experience.user} showName={false} />
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{experience.user.name}</span>
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
  return (
    <div className="flex items-center gap-4">
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
