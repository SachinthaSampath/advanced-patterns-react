import { Comment, User } from "@advanced-react/server/database/schema";
import type { Experience } from "@advanced-react/server/features/experience/models";
import { commentValidationSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

export type OptimisticComment = Comment & {
  optimistic: true;
  user: User;
};

type CommentFormData = z.infer<typeof commentValidationSchema>;

type CommentFormProps = {
  experienceId: Experience["id"];
};

export default function CommentForm({ experienceId }: CommentFormProps) {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentValidationSchema),
  });

  const utils = trpc.useUtils();

  const addCommentMutation = trpc.comments.add.useMutation({
    async onMutate(data) {
      form.reset();

      if (!currentUser) {
        return;
      }

      const optimisticComment: OptimisticComment = {
        id: Math.random(),
        optimistic: true,
        content: data.content,
        experienceId,
        userId: currentUser.id,
        user: currentUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await utils.comments.byExperienceId.cancel();

      const previousCommentsByExperienceId =
        utils.comments.byExperienceId.getData({ experienceId });

      utils.comments.byExperienceId.setData({ experienceId }, (oldData) => {
        if (!oldData) {
          return [optimisticComment];
        }
        return [optimisticComment, ...oldData];
      });

      return {
        previousCommentsByExperienceId,
      };
    },
    onSuccess: async () => {
      await utils.comments.byExperienceId.invalidate({ experienceId });

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError(_, __, context) {
      utils.comments.byExperienceId.setData(
        { experienceId },
        context?.previousCommentsByExperienceId,
      );

      toast({
        title: "Failed to add comment",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CommentFormData) {
    addCommentMutation.mutate({
      content: data.content,
      experienceId,
    });
  }

  if (!currentUser) {
    return (
      <div className="text-center text-neutral-500">
        Please log in to add comments
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField<CommentFormData> name="content">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              placeholder="Add a comment..."
              error={error}
            />
          )}
        </FormField>
        <Button type="submit" disabled={addCommentMutation.isPending}>
          Add Comment
        </Button>
      </form>
    </FormProvider>
  );
}
