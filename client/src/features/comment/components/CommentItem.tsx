import { Comment } from "@advanced-react/server/features/comment/models";
import { commentSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import TextArea from "@/features/shared/components/ui/TextArea";
import { trpc } from "@/router";

type CommentItemProps = {
  comment: Comment;
  onCommentUpdated: () => void;
};

type EditCommentFormData = Omit<z.infer<typeof commentSchema>, "id">;

export default function CommentItem({
  comment,
  onCommentUpdated,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EditCommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: comment.content,
    },
  });

  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.byExperienceId.invalidate({
        experienceId: comment.experienceId,
      });
      onCommentUpdated();
    },
  });

  const editMutation = trpc.comments.edit.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.comments.byExperienceId.invalidate({
        experienceId: comment.experienceId,
      });
      onCommentUpdated();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const handleEdit = form.handleSubmit((data) => {
    editMutation.mutate({
      id: comment.id,
      content: data.content,
    });
  });

  if (isEditing) {
    return (
      <FormProvider {...form}>
        <form
          onSubmit={handleEdit}
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

  return (
    <div className="rounded bg-neutral-50 p-2 dark:bg-neutral-800">
      <p className="text-neutral-800 dark:text-neutral-100">
        {comment.content}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <time className="text-xs text-neutral-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        <div className="flex gap-2">
          <Button variant="link" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button
            variant="destructive-link"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
