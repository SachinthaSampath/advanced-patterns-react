import { User } from "@advanced-react/server/database/schema";

type UserWithFollowCounts = User & {
  followersCount: number;
  followingCount: number;
};

export type UserWithUserContext = User & {
  isFollowing: boolean;
};

type UserWithHostedExperiences = User & {
  hostedExperiencesCount: number;
};

export type UserEnhanced = UserWithFollowCounts &
  UserWithUserContext &
  UserWithHostedExperiences;
