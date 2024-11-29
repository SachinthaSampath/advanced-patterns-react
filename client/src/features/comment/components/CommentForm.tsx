import type { Experience } from "@advanced-react/server/features/experience/models";
import { commentSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import { trpc } from "@/router";

type CommentFormData = Omit<z.infer<typeof commentSchema>, "id">;

type CommentFormProps = {
  experienceId: Experience["id"];
  onSuccess?: () => void;
};

export default function CommentForm({
  experienceId,
  onSuccess,
}: CommentFormProps) {
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess,
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
              disabled={addCommentMutation.isPending}
            />
          )}
        </FormField>
        <Button type="submit" disabled={addCommentMutation.isPending}>
          {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
        </Button>
      </form>
    </FormProvider>
  );
}
