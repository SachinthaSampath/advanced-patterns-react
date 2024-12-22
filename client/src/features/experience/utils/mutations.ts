import { AppRouter } from "@advanced-react/server";
import { UtilsLike } from "@trpc/react-query/shared";

// Returns a centralized list of queries for the experience feed and byId to use for optimistic updates
export function getExperienceQueries(utils: UtilsLike<AppRouter>) {
  return {
    feed: [utils.experiences.feed, utils.users.experiences],
    byId: [utils.experiences.byId],
  };
}
