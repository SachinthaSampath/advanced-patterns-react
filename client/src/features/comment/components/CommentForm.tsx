import { Comment } from "@advanced-react/server/database/schema";
import type { Experience } from "@advanced-react/server/features/experience/models";
import { commentSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

export type OptimisticComment = Comment & { optimistic: true };

type CommentFormData = Omit<z.infer<typeof commentSchema>, "id">;

type CommentFormProps = {
  experienceId: Experience["id"];
};

export default function CommentForm({ experienceId }: CommentFormProps) {
  const { toast } = useToast();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema.omit({ id: true })),
  });

  const utils = trpc.useUtils();

  const addCommentMutation = trpc.comments.add.useMutation({
    async onMutate(data) {
      form.reset();

      const optimisticComment: OptimisticComment = {
        id: Math.random(),
        optimistic: true,
        content: data.content,
        experienceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await utils.comments.byExperienceId.cancel();

      const previousCommentsByExperienceId =
        utils.comments.byExperienceId.getData({ experienceId }) as Comment[];

      utils.comments.byExperienceId.setData(
        { experienceId },
        (oldData: Comment[] | undefined) => {
          if (!oldData) {
            return [optimisticComment];
          }
          return [optimisticComment, ...oldData];
        },
      );

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
      experienceId,
      content: data.content,
    });
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
