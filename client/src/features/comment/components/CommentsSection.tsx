import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

import { trpc } from "@/lib/trpc";

type CommentsSectionProps = {
  postId: number;
};

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const utils = trpc.useContext();
  const commentsQuery = trpc.comments.byPostId.useQuery({ postId });
  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.byPostId.invalidate({ postId });
    },
  });

  const handleAddComment = (content: string) => {
    addCommentMutation.mutate({
      postId,
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
