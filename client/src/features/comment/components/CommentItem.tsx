import { Comment, User } from "@advanced-react/server/database/schema";
import { useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import UserAvatar from "@/features/user/components/UserAvatar";
import { cn } from "@/lib/utils/cn";
import { trpc } from "@/router";

import CommentEditForm from "./CommentEditForm";
import { OptimisticComment } from "./CommentForm";

type CommentItemProps = {
  comment: (Comment & { user: User }) | OptimisticComment;
};

export default function CommentItem({ comment }: CommentItemProps) {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
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
        (oldData) => oldData?.filter((c) => c.id !== id),
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

  const isCommentOwner = currentUser?.id === comment.userId;

  return (
    <div
      className={cn(
        "space-y-2 rounded bg-neutral-50 p-4 dark:bg-neutral-800",
        (comment as OptimisticComment).optimistic && "opacity-50",
      )}
    >
      <UserAvatar user={comment.user} />
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        {isCommentOwner && (
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
        )}
      </div>
    </div>
  );
}
