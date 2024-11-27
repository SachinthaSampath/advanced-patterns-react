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
    <article className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">{experience.title}</h2>
          <p className="text-neutral-800 dark:text-neutral-100 mb-2">
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
