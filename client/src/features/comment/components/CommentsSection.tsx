import { trpc } from "@/router";

import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

type CommentsSectionProps = {
  experienceId: number;
};

export default function CommentsSection({
  experienceId,
}: CommentsSectionProps) {
  const utils = trpc.useUtils();

  const commentsQuery = trpc.comments.byExperienceId.useQuery({ experienceId });

  return (
    <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <h3 className="mb-2 font-semibold">Comments</h3>

      <CommentForm
        experienceId={experienceId}
        onSuccess={() => {
          utils.comments.byExperienceId.invalidate({ experienceId });
        }}
      />

      {commentsQuery.data && (
        <CommentList
          comments={commentsQuery.data}
          onCommentUpdated={() => {
            commentsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
