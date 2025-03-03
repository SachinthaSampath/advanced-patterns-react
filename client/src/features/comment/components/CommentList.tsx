import { CommentEnhanced, CommentOptimistic } from "../types";
import CommentCard from "./CommentCard";

type CommentListProps = {
  comments: (CommentEnhanced | CommentOptimistic)[];
};

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
