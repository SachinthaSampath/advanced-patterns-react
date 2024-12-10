import { Comment } from "@advanced-react/server/features/comment/models";
import { commentValidationSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type EditCommentFormData = z.infer<typeof commentValidationSchema>;

type CommentEditFormProps = {
  comment: Comment;
  setIsEditing: (value: boolean) => void;
};

export default function CommentEditForm({
  comment,
  setIsEditing,
}: CommentEditFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const form = useForm<EditCommentFormData>({
    resolver: zodResolver(commentValidationSchema),
    defaultValues: {
      content: comment.content,
    },
  });

  const editMutation = trpc.comments.edit.useMutation({
    async onMutate(data) {
      setIsEditing(false);

      await utils.comments.byExperienceId.cancel();

      const previousComments = utils.comments.byExperienceId.getData({
        experienceId: comment.experienceId,
      });

      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        (oldData) =>
          oldData?.map((c) =>
            c.id === comment.id ? { ...c, content: data.content } : c,
          ),
      );

      return { previousComments };
    },
    onSuccess() {
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      });
    },
    onError(_, __, context) {
      utils.comments.byExperienceId.setData(
        { experienceId: comment.experienceId },
        context?.previousComments,
      );

      toast({
        title: "Failed to edit comment",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    editMutation.mutate({
      id: comment.id,
      content: data.content,
    });
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className="rounded bg-neutral-50 p-2 dark:bg-neutral-800"
      >
        <FormField<EditCommentFormData> name="content" className="mb-2">
          {({ error, name }) => (
            <TextArea
              {...form.register(name)}
              rows={2}
              error={error}
              disabled={editMutation.isPending}
            />
          )}
        </FormField>
        <div className="flex gap-2">
          <Button type="submit" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button variant="link" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
