import { trpc } from "@/router";
import { Experience } from "@advanced-react/server/database/schema";
import { CommentCreateForm } from "./CommentCreateForm";
import { CommentList } from "./CommentList";

type CommentSectionProps = {
  experienceId: Experience["id"];
  commentsCount: number;
};

export function CommentSection({
  commentsCount,
  experienceId,
}: CommentSectionProps) {
  const commentsQuery = trpc.comments.byExperienceId.useQuery(
    { experienceId },
    {
      enabled: commentsCount > 0,
    },
  );

  if (commentsQuery.isError) return <div>Something went wrong</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Comments ({commentsCount})</h3>
      <CommentCreateForm experienceId={experienceId} />
      <CommentList
        comments={commentsQuery.data ?? []}
        isLoading={commentsQuery.isLoading}
      />
    </div>
  );
}
