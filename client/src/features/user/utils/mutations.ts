import { AppRouter } from "@advanced-react/server";
import { UtilsLike } from "@trpc/react-query/shared";

// Returns a centralized list of queries for the user profile and lists to use for optimistic updates
export function getUserQueries(utils: UtilsLike<AppRouter>) {
  return {
    byId: [utils.users.byId],
    lists: [utils.users.followers, utils.users.following],
  };
}
