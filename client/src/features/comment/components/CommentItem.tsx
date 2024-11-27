import { Comment } from "@advanced-react/server/features/comment/models";
import { useState } from "react";

import Button from "@/features/shared/components/ui/button";
import { trpc } from "@/router";

type CommentItemProps = {
  comment: Comment;
  onCommentUpdated: () => void;
};

export default function CommentItem({
  comment,
  onCommentUpdated,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.byExperienceId.invalidate({
        experienceId: comment.experienceId,
      });
      onCommentUpdated();
    },
  });

  const editMutation = trpc.comments.edit.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.comments.byExperienceId.invalidate({
        experienceId: comment.experienceId,
      });
      onCommentUpdated();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    editMutation.mutate({
      id: comment.id,
      content: editContent,
    });
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleEdit}
        className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded"
      >
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 border border-neutral-200 dark:border-neutral-800 rounded mb-2"
          rows={2}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="link" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="flex items-center justify-between mt-1">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        <div className="flex gap-2">
          <Button variant="link" onClick={() => setIsEditing(true)}>
            Edit
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
    </div>
  );
}
