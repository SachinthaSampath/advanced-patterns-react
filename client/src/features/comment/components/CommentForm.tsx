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

type CommentFormData = Omit<z.infer<typeof commentSchema>, "id">;

type CommentFormProps = {
  experienceId: Experience["id"];
  onSuccess?: () => void;
};

export default function CommentForm({
  experienceId,
  onSuccess,
}: CommentFormProps) {
  const { toast } = useToast();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema.omit({ id: true })),
  });

  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });

      onSuccess?.();
    },
    onError() {
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
