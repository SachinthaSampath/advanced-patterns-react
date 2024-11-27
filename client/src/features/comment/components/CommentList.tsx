import { Comment } from "@advanced-react/server/features/comment/models";

import CommentItem from "./CommentItem";

type CommentListProps = {
  comments: Comment[];
  onCommentUpdated: () => void;
};

export default function CommentList({
  comments,
  onCommentUpdated,
}: CommentListProps) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onCommentUpdated={onCommentUpdated}
        />
      ))}
    </div>
  );
}
