import { User } from "@advanced-react/server/database/schema";
import { Comment } from "@advanced-react/server/features/comment/models";

import { OptimisticComment } from "../types";
import CommentCard from "./CommentCard";

type CommentListProps = {
  comments: ((Comment & { user: User }) | OptimisticComment)[];
};

export default function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
