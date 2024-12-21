import { Comment, User } from "@advanced-react/server/database/schema";
import { useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import { useToast } from "@/features/shared/hooks/useToast";
import UserAvatar from "@/features/user/components/UserAvatar";
import { cn } from "@/lib/utils/cn";
import { trpc } from "@/router";

import { OptimisticComment } from "../types";
import CommentEditForm from "./CommentEditForm";

type CommentCardProps = {
  comment: (Comment & { user: User }) | OptimisticComment;
};

export default function CommentCard({ comment }: CommentCardProps) {
  const { currentUser } = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <CommentEditForm comment={comment} setIsEditing={setIsEditing} />;
  }

  const isCommentOwner = currentUser?.id === comment.userId;

  return (
    <div
      className={cn("space-y-2 rounded bg-neutral-50 p-4 dark:bg-neutral-800")}
    >
      <Link to="/users/$userId" params={{ userId: comment.user.id }}>
        <UserAvatar user={comment.user} />
      </Link>
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        {isCommentOwner && (
          <CommentCardOwnerButtons
            comment={comment}
            setIsEditing={setIsEditing}
          />
        )}
      </div>
    </div>
  );
}

type CommentCardOwnerButtonsProps = Pick<CommentCardProps, "comment"> & {
  setIsEditing: (isEditing: boolean) => void;
};

function CommentCardOwnerButtons({
  comment,
  setIsEditing,
}: CommentCardOwnerButtonsProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.comments.byExperienceId.cancel(),
        utils.experiences.byId.cancel(),
      ]);

      const previousComments = utils.comments.byExperienceId.getData({
        experienceId: comment.experienceId,
      });

      const previousExperience = utils.experiences.byId.getData({
        id: comment.experienceId,
      });

      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        (oldData) => oldData?.filter((c) => c.id !== id),
      );

      utils.experiences.byId.setData(
        { id: comment.experienceId },
        (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            commentsCount: Math.max(0, oldData.commentsCount - 1),
          };
        },
      );

      return { previousComments, previousExperience };
    },
    onSuccess: async () => {
      await Promise.all([
        utils.comments.byExperienceId.invalidate({
          experienceId: comment.experienceId,
        }),
        utils.experiences.byId.invalidate({
          id: comment.experienceId,
        }),
      ]);
    },
    onError: (error, __, context) => {
      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        context?.previousComments,
      );

      utils.experiences.byId.setData(
        { id: comment.experienceId },
        context?.previousExperience,
      );

      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return (
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
          deleteMutation.isPending || (comment as OptimisticComment).optimistic
        }
      >
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
