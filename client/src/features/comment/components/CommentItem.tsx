import { Comment } from "@advanced-react/server/features/comment/models";
import { useState } from "react";

import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

import CommentEditForm from "./CommentEditForm";

type CommentItemProps = {
  comment: Comment;
};

export default function CommentItem({ comment }: CommentItemProps) {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess() {
      utils.comments.byExperienceId.invalidate({
        experienceId: comment.experienceId,
      });

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
    },
    onError() {
      toast({
        title: "Failed to delete comment",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  if (isEditing) {
    return (
      <CommentEditForm
        comment={comment}
        onSuccess={() => {
          setIsEditing(false);

          utils.comments.byExperienceId.invalidate({
            experienceId: comment.experienceId,
          });
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="rounded bg-neutral-50 p-2 dark:bg-neutral-800">
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        <div className="flex gap-2">
          <Button variant="link" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button
            variant="destructive-link"
            onClick={() => deleteMutation.mutate({ id: comment.id })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
