import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import { trpc } from "@/router";

import CommentCreateForm from "./CommentCreateForm";
import CommentList from "./CommentList";

type CommentsSectionProps = {
  experienceId: number;
  commentsCount: number;
};

export default function CommentsSection({
  experienceId,
  commentsCount,
}: CommentsSectionProps) {
  const commentsQuery = trpc.comments.byExperienceId.useQuery({ experienceId });

  if (commentsQuery.isPending) {
    return <div>Loading comments...</div>;
  }

  if (commentsQuery.error) {
    return <QueryErrorFallback refetch={commentsQuery.refetch} />;
  }

  if (!commentsQuery.data) {
    return <div>No comments found</div>;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <h3 className="mb-2 font-semibold">Comments ({commentsCount})</h3>

      <CommentCreateForm experienceId={experienceId} />

      {commentsQuery.data && <CommentList comments={commentsQuery.data} />}
    </div>
  );
}
