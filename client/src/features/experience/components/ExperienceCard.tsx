import { Experience } from "@advanced-react/server/features/experience/models";
import { useState } from "react";

import CommentsSection from "@/features/comment/components/CommentsSection";
import { trpc } from "@/lib/trpc";

import ExperienceForm from "./ExperienceForm";

type ExperienceCardProps = {
  experience: Experience;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.experiences.delete.useMutation({
    onSuccess: () => {
      utils.experiences.feed.invalidate();
    },
  });

  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.experiences.feed.invalidate();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this experience?")) {
      deleteMutation.mutate({ id: experience.id });
    }
  };

  const handleEdit = (data: { title: string; content: string }) => {
    editMutation.mutate({
      id: experience.id,
      ...data,
    });
  };

  if (isEditing) {
    return (
      <ExperienceForm
        initialData={experience}
        onSubmit={handleEdit}
        isSubmitting={editMutation.isPending}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

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
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
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
