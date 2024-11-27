import { Experience } from "@advanced-react/server/features/experience/models";
import { Link } from "@tanstack/react-router";

import CommentsSection from "@/features/comment/components/CommentsSection";
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
    <article className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">{experience.title}</h2>
          <p className="text-gray-700 mb-2">{experience.content}</p>
          <time className="text-sm text-gray-500">
            Posted on: {new Date(experience.createdAt).toLocaleDateString()}
          </time>
        </div>
        <div className="flex gap-2">
          <Link
            to="/experiences/$experienceId/edit"
            params={{ experienceId: experience.id }}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-sm text-red-500 hover:text-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <CommentsSection experienceId={experience.id} />
    </article>
  );
}
