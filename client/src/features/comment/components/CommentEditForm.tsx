import { Comment } from "@advanced-react/server/features/comment/models";
import { commentSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type EditCommentFormData = Omit<z.infer<typeof commentSchema>, "id">;

type CommentEditFormProps = {
  comment: Comment;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function CommentEditForm({
  comment,
  onSuccess,
  onCancel,
}: CommentEditFormProps) {
  const { toast } = useToast();

  const form = useForm<EditCommentFormData>({
    resolver: zodResolver(commentSchema.omit({ id: true })),
    defaultValues: {
      content: comment.content,
    },
  });

  const editMutation = trpc.comments.edit.useMutation({
    onSuccess() {
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      });

      onSuccess?.();
    },
    onError() {
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
          <Button variant="link" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
