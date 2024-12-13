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

import { OptimisticComment } from "../types";

type CommentCreateFormData = z.infer<typeof commentValidationSchema>;

type CommentCreateFormProps = {
  experienceId: Experience["id"];
};

export default function CommentCreateForm({
  experienceId,
}: CommentCreateFormProps) {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();

  const form = useForm<CommentCreateFormData>({
    resolver: zodResolver(commentValidationSchema),
  });

  const addCommentMutation = trpc.comments.add.useMutation({
    onMutate: async (data) => {
      if (!currentUser) {
        return;
      }

      form.reset();

      await Promise.all([
        utils.comments.byExperienceId.cancel(),
        utils.experiences.byId.cancel(),
      ]);

      const previousComments = utils.comments.byExperienceId.getData({
        experienceId,
      });

      const previousExperience = utils.experiences.byId.getData({
        id: experienceId,
      });

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

      utils.comments.byExperienceId.setData({ experienceId }, (oldData) => {
        if (!oldData) {
          return [optimisticComment];
        }

        return [optimisticComment, ...oldData];
      });

      utils.experiences.byId.setData({ id: experienceId }, (oldData) => {
        if (!oldData) {
          return;
        }

        return {
          ...oldData,
          commentsCount: oldData.commentsCount + 1,
        };
      });

      return {
        previousComments,
        previousExperience,
      };
    },
    onSuccess: async () => {
      await Promise.all([
        utils.comments.byExperienceId.invalidate({
          experienceId,
        }),
        utils.experiences.byId.invalidate({
          id: experienceId,
        }),
      ]);
    },
    onError: (error, __, context) => {
      utils.comments.byExperienceId.setData(
        { experienceId },
        context?.previousComments,
      );

      utils.experiences.byId.setData(
        { id: experienceId },
        context?.previousExperience,
      );

      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    addCommentMutation.mutate({
      content: data.content,
      experienceId,
    });
  });

  if (!currentUser) {
    return (
      <div className="text-center text-neutral-500">
        Please log in to add comments
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <FormField<CommentCreateFormData> name="content">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              placeholder="Add a comment..."
              error={error}
            />
          )}
        </FormField>
        <Button type="submit">Add Comment</Button>
      </form>
    </FormProvider>
  );
}
