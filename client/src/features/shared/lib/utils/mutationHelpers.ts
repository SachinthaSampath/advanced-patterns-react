import { AppRouter } from "@advanced-react/server";
import { UtilsLike } from "@trpc/react-query/shared";

export const getExperienceQueries = (utils: UtilsLike<AppRouter>) => {
  return {
    feed: [utils.experiences.feed],
    byId: [utils.experiences.byId],
  };
};
