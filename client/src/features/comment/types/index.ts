import { Comment, User } from "@advanced-react/server/database/schema";

export type OptimisticComment = Comment & {
  optimistic: true;
  user: User;
  isLiked: boolean;
  likesCount: number;
};
