import { useParams } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

export function useCommentMutations(commentId: number) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

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

  return {
    likeMutation,
    unlikeMutation,
  };
}
