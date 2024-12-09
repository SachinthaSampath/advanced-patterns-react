import { Comment } from "@advanced-react/server/features/comment/models";
import { useState } from "react";

import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { cn } from "@/lib/utils/cn";
import { trpc } from "@/router";

import CommentEditForm from "./CommentEditForm";
import { OptimisticComment } from "./CommentForm";

type CommentItemProps = {
  comment: Comment | OptimisticComment;
};

export default function CommentItem({ comment }: CommentItemProps) {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    async onMutate({ id }) {
      await utils.comments.byExperienceId.cancel();

      const previousComments = utils.comments.byExperienceId.getData({
        experienceId: comment.experienceId,
      });

      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        (oldData: Comment[] | undefined) => oldData?.filter((c) => c.id !== id),
      );

      return { previousComments };
    },
    onSuccess() {
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
    },
    onError(_, __, context) {
      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        context?.previousComments,
      );

      toast({
        title: "Failed to delete comment",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  if (isEditing) {
    return <CommentEditForm comment={comment} setIsEditing={setIsEditing} />;
  }

  return (
    <div
      className={cn(
        "rounded bg-neutral-50 p-2 dark:bg-neutral-800",
        (comment as OptimisticComment).optimistic && "opacity-50",
      )}
    >
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        <div className="flex gap-2">
          <Button
            variant="link"
            onClick={() => setIsEditing(true)}
            disabled={(comment as OptimisticComment).optimistic}
          >
            Edit
          </Button>
          <Button
            variant="destructive-link"
            onClick={() => deleteMutation.mutate({ id: comment.id })}
            disabled={
              deleteMutation.isPending ||
              (comment as OptimisticComment).optimistic
            }
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
