import { Experience, User } from "@advanced-react/server/database/schema";

import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import UserAvatar from "@/features/user/components/UserAvatar";
import { trpc } from "@/router";

type ExperienceCardProps = {
  experience: Experience & { user: User };
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
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
            <ExperienceCardButtons experience={experience} />
          </div>
          <p className="text-neutral-800 dark:text-neutral-100">
            {experience.content}
          </p>
        </div>
      </div>
    </article>
  );
}

type ExperienceCardButtonsProps = {
  experience: Experience;
};

function ExperienceCardButtons({ experience }: ExperienceCardButtonsProps) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.experiences.delete.useMutation({
    async onSuccess() {
      await utils.experiences.feed.invalidate();
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
