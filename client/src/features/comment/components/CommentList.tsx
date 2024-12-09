import { Comment } from "@advanced-react/server/features/comment/models";

import CommentItem from "./CommentItem";

type CommentListProps = {
  comments: Comment[];
};

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
