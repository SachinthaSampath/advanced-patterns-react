import { Experience, Tag, User } from "@advanced-react/server/database/schema";

type ExperienceWithUser = Experience & {
  user: User;
};

type ExperienceWithUserContext = Experience & {
  isFavorited: boolean;
  isAttending: boolean;
};

type ExperienceWithCommentsCount = Experience & {
  commentsCount: number;
};

type ExperienceWithFavoritesCount = Experience & {
  favoritesCount: number;
};

type ExperienceWithAttendeesCount = Experience & {
  attendeesCount: number;
};

type ExperienceWithAttendees = Experience & {
  attendees: User[];
};

type ExperienceWithTags = Experience & {
  tags: Tag[];
};

export type ExperienceForDetails = ExperienceWithUser &
  ExperienceWithUserContext &
  ExperienceWithCommentsCount &
  ExperienceWithFavoritesCount &
  ExperienceWithAttendeesCount &
  ExperienceWithAttendees &
  ExperienceWithTags;

export type ExperienceForList = ExperienceWithUser &
  ExperienceWithUserContext &
  ExperienceWithCommentsCount &
  ExperienceWithFavoritesCount &
  ExperienceWithAttendeesCount &
  ExperienceWithTags;
