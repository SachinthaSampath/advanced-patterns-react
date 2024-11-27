import type { Experience } from "@advanced-react/server/features/experience/models";

import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import { trpc } from "@/router";

type ExperienceCardProps = {
  experience: Experience;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{experience.title}</h2>
          <p className="text-neutral-800 dark:text-neutral-100">
            {experience.content}
          </p>
          <time className="text-sm text-neutral-500">
            Posted on: {new Date(experience.createdAt).toLocaleDateString()}
          </time>
        </div>
        <ExperienceCardButtons experience={experience} />
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
    onSuccess: () => {
      utils.experiences.feed.invalidate();
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
