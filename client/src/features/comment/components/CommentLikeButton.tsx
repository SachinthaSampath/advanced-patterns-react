import { Comment } from "@advanced-react/server/database/schema";
import { useParams } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Button } from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { cn } from "@/lib/utils/cn";
import { trpc } from "@/router";

type CommentLikeButtonProps = {
  id: Comment["id"];
  isLiked: boolean;
  likesCount: number;
  isOptimistic: boolean;
};

export function CommentLikeButton({
  id: commentId,
  isLiked,
  likesCount,
  isOptimistic,
}: CommentLikeButtonProps) {
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { experienceId } = useParams({ strict: false });

  const optimisticUpdates = [
    {
      key: "byExperienceId",
      procedure: utils.comments.byExperienceId,
      args: { experienceId: Number(experienceId) },
      type: "query",
    },
  ] as const;

  const likeMutation = trpc.comments.like.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      function updateComment<
        T extends { isLiked: boolean; likesCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isLiked: true,
          likesCount: oldData.likesCount + 1,
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args }) => ({
          [key]: procedure.getData(args),
        }),
      );

      optimisticUpdates.forEach(({ procedure, args }) => {
        procedure.setData(args, (oldData) => {
          if (!oldData) {
            return;
          }

          return oldData.map((comment) =>
            comment.id === commentId ? updateComment(comment) : comment,
          );
        });
      });

      return { previousData };
    },
    onError: (error, __, context) => {
      optimisticUpdates.forEach(({ key, procedure, args }) => {
        procedure.setData(args, context?.previousData[key]);
      });

      toast({
        title: "Failed to like comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unlikeMutation = trpc.comments.unlike.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      function updateComment<
        T extends { isLiked: boolean; likesCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isLiked: false,
          likesCount: Math.max(0, oldData.likesCount - 1),
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args }) => ({
          [key]: procedure.getData(args),
        }),
      );

      optimisticUpdates.forEach(({ procedure, args }) => {
        procedure.setData(args, (oldData) => {
          if (!oldData) {
            return;
          }

          return oldData.map((comment) =>
            comment.id === commentId ? updateComment(comment) : comment,
          );
        });
      });

      return { previousData };
    },
    onError: (error, __, context) => {
      optimisticUpdates.forEach(({ key, procedure, args }) => {
        procedure.setData(args, context?.previousData[key]);
      });

      toast({
        title: "Failed to unlike comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant="link"
      onClick={() =>
        isLiked
          ? unlikeMutation.mutate({ id: commentId })
          : likeMutation.mutate({ id: commentId })
      }
      disabled={
        isOptimistic || likeMutation.isPending || unlikeMutation.isPending
      }
    >
      <Heart
        className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")}
      />
      <span>{likesCount}</span>
    </Button>
  );
}
