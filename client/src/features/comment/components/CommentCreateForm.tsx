import { Button } from "@/features/shared/components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/features/shared/components/ui/Form";
import { TextArea } from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/trpc";
import { Experience } from "@advanced-react/server/database/schema";
import { commentValidationSchema } from "@advanced-react/shared/schema/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type CommentCreateFormValues = z.infer<typeof commentValidationSchema>;

type CommentCreateFormProps = {
  experienceId: Experience["id"];
};

export function CommentCreateForm({ experienceId }: CommentCreateFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: async ({ experienceId }) => {
      await Promise.all([
        utils.comments.byExperienceId.invalidate({ experienceId }),
        utils.experiences.feed.invalidate({}),
      ]);
      form.reset();
      toast({
        title: "Comment added",
        description: "Your comment has been added",
      });
    },
    onError: async (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CommentCreateFormValues>({
    resolver: zodResolver(commentValidationSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    addCommentMutation.mutate({
      experienceId,
      content: data.content,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <TextArea {...field} placeholder="Add a comment..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={addCommentMutation.isPending}>
          {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
        </Button>
      </form>
    </Form>
  );
}
