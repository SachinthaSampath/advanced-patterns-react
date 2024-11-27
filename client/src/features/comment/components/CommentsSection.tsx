import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

import { trpc } from "@/lib/trpc";

type CommentsSectionProps = {
  experienceId: number;
};

export default function CommentsSection({
  experienceId,
}: CommentsSectionProps) {
  const utils = trpc.useUtils();
  const commentsQuery = trpc.comments.byExperienceId.useQuery({ experienceId });
  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.byExperienceId.invalidate({ experienceId });
    },
  });

  const handleAddComment = (content: string) => {
    addCommentMutation.mutate({
      experienceId,
      content,
    });
  };

  const handleCommentUpdated = () => {
    commentsQuery.refetch();
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="font-semibold mb-2">Comments</h3>

      <CommentForm
        onSubmit={handleAddComment}
        isSubmitting={addCommentMutation.isPending}
      />

      {commentsQuery.data && (
        <CommentList
          comments={commentsQuery.data}
          onCommentUpdated={handleCommentUpdated}
        />
      )}
    </div>
  );
}
