import { Experience } from "@advanced-react/server/features/experience/models";

import CommentsSection from "@/features/comment/components/CommentsSection";
import Button from "@/features/shared/components/ui/button";
import Link from "@/features/shared/components/ui/Link";
import { trpc } from "@/router";

type ExperienceCardProps = {
  experience: Experience;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const utils = trpc.useUtils();

  const deleteMutation = trpc.experiences.delete.useMutation({
    onSuccess: () => {
      utils.experiences.feed.invalidate();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this experience?")) {
      deleteMutation.mutate({ id: experience.id });
    }
  };

  return (
    <article className="mb-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-xl font-bold">{experience.title}</h2>
          <p className="mb-2 text-neutral-800 dark:text-neutral-100">
            {experience.content}
          </p>
          <time className="text-sm text-neutral-500">
            Posted on: {new Date(experience.createdAt).toLocaleDateString()}
          </time>
        </div>
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
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <CommentsSection experienceId={experience.id} />
    </article>
  );
}
