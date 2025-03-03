import {
  Comment,
  Experience,
  User,
} from "@advanced-react/server/database/schema";

type CommentWithUser = Comment & {
  user: User;
};

type CommentWithExperience = Comment & {
  experience: Experience;
};

type CommentWithUserContext = Comment & {
  isLiked: boolean;
};

type CommentWithLikesCount = Comment & {
  likesCount: number;
};

export type CommentEnhanced = CommentWithUser &
  CommentWithExperience &
  CommentWithUserContext &
  CommentWithLikesCount;

export type CommentOptimistic = CommentWithUser &
  CommentWithExperience &
  CommentWithUserContext &
  CommentWithLikesCount & {
    optimistic: true;
  };
