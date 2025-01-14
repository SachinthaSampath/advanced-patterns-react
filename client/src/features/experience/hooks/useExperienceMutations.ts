import { AppRouter } from "@advanced-react/server";
import { User } from "@advanced-react/server/database/schema";
import { useParams, useSearch } from "@tanstack/react-router";
import { DecorateProcedure } from "@trpc/react-query/shared";
import {
  AnyQueryProcedure,
  inferProcedureInput,
  inferRouterInputs,
} from "@trpc/server";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc, trpcQueryUtils } from "@/router";

type ExperienceMutationsOptions = {
  delete?: {
    onSuccess?: () => void;
  };
};

export function useExperienceMutations(
  experienceId: number,
  options: ExperienceMutationsOptions = {},
) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { userId: pathUserId } = useParams({ strict: false });
  const { tagId: pathTagId } = useParams({ strict: false });

  const { q: pathQ } = useSearch({ strict: false });
  const { scheduledAt: pathScheduledAt } = useSearch({ strict: false });
  const { tags: pathTags } = useSearch({ strict: false });

  const optimisticUpdates = [
    {
      key: "byId",
      procedure: utils.experiences.byId,
      args: { id: experienceId },
      type: "query",
    },
    {
      key: "feed",
      procedure: utils.experiences.feed,
      args: {},
      type: "infiniteQuery",
    },
    ...(pathQ || pathScheduledAt || pathTags
      ? [
          {
            key: "search",
            procedure: utils.experiences.search,
            args: {
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            },
            type: "infiniteQuery",
          },
        ]
      : []),
    {
      key: "favorites",
      procedure: utils.experiences.favorites,
      args: {},
      type: "infiniteQuery",
    },
    ...(pathUserId
      ? [
          {
            key: "userExperiences",
            procedure: utils.users.experiences,
            args: { id: pathUserId },
            type: "infiniteQuery",
          },
        ]
      : []),
    ...(pathTagId
      ? [
          {
            key: "tagExperiences",
            procedure: utils.tags.experiences,
            args: { id: pathTagId },
            type: "infiniteQuery",
          },
        ]
      : []),
  ] as const;

  const attendMutation = trpc.experiences.attend.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      function updateExperience<
        T extends { attendeesCount: number; attendees: User[] },
      >(oldData: T) {
        return {
          ...oldData,
          attendeesCount: oldData.attendeesCount + 1,
          attendees: [currentUser, ...oldData.attendees],
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      // await Promise.all([
      //   utils.experiences.byId.cancel({ id }),
      //   utils.experiences.feed.cancel(),
      //   pathQ || pathScheduledAt || pathTags
      //     ? utils.experiences.search.cancel({
      //         q: pathQ,
      //         scheduledAt: pathScheduledAt,
      //         tags: pathTags,
      //       })
      //     : undefined,
      //   utils.experiences.favorites.cancel(),
      //   pathUserId
      //     ? utils.users.experiences.cancel({ id: pathUserId })
      //     : undefined,
      //   pathTagId
      //     ? utils.tags.experiences.cancel({ id: pathTagId })
      //     : undefined,
      // ]);

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args, type }) => ({
          [key]:
            type === "query"
              ? procedure.getData(args)
              : procedure.getInfiniteData(args),
        }),
      );

      // const previousData = {
      //   byId: utils.experiences.byId.getData({ id }),
      //   feed: utils.experiences.feed.getInfiniteData(),
      //   search:
      //     pathQ || pathScheduledAt || pathTags
      //       ? utils.experiences.search.getInfiniteData({
      //           q: pathQ,
      //           scheduledAt: pathScheduledAt,
      //           tags: pathTags,
      //         })
      //       : undefined,
      //   favorites: utils.experiences.favorites.getInfiniteData(),
      //   byUserId: pathUserId
      //     ? utils.users.experiences.getInfiniteData({ id: pathUserId })
      //     : undefined,
      //   byTagId: pathTagId
      //     ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
      //     : undefined,
      // };

      optimisticUpdates.forEach(({ procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, (oldData) => {
            if (!oldData) {
              return;
            }

            return updateExperience(oldData);
          });
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.map((e) =>
                  e.id === experienceId ? updateExperience(e) : e,
                ),
              })),
            };
          });
        }
      });

      // utils.experiences.byId.setData({ id }, (oldData) => {
      //   if (!oldData) {
      //     return;
      //   }

      //   return updateExperience(oldData);
      // });

      // utils.experiences.feed.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
      //     if (!oldData) {
      //       return { pages: [], pageParams: [] };
      //     }

      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map((page) => ({
      //         ...page,
      //         experiences: page.experiences.map((e) =>
      //           e.id === experienceId ? updateExperience(e) : e,
      //         ),
      //       })),
      //     };
      //   });
      // }

      return { previousData };
    },
    onError: (error, __, context) => {
      optimisticUpdates.forEach(({ key, procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, context?.previousData[key]);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, context?.previousData[key]);
        }
      });

      // utils.experiences.byId.setData({ id }, context?.previousData.byId);

      // utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     context?.previousData.search,
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData(
      //   {},
      //   context?.previousData.favorites,
      // );

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     context?.previousData.byUserId,
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData(
      //     { id: pathTagId },
      //     context?.previousData.byTagId,
      //   );
      // }

      toast({
        title: "Failed to attend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unattendMutation = trpc.experiences.unattend.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<
        T extends { attendeesCount: number; attendees: User[] },
      >(oldData: T) {
        return {
          ...oldData,
          attendeesCount: Math.max(0, oldData.attendeesCount - 1),
          attendees: oldData.attendees.filter((a) => a.id !== currentUser?.id),
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      // await Promise.all([
      //   utils.experiences.byId.cancel({ id }),
      //   utils.experiences.feed.cancel(),
      //   pathQ || pathScheduledAt || pathTags
      //     ? utils.experiences.search.cancel({
      //         q: pathQ,
      //         scheduledAt: pathScheduledAt,
      //         tags: pathTags,
      //       })
      //     : undefined,
      //   utils.experiences.favorites.cancel(),
      //   pathUserId
      //     ? utils.users.experiences.cancel({ id: pathUserId })
      //     : undefined,
      //   pathTagId
      //     ? utils.tags.experiences.cancel({ id: pathTagId })
      //     : undefined,
      // ]);

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args, type }) => ({
          [key]:
            type === "query"
              ? procedure.getData(args)
              : procedure.getInfiniteData(args),
        }),
      );

      optimisticUpdates.forEach(({ procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, (oldData) => {
            if (!oldData) {
              return;
            }

            return updateExperience(oldData);
          });
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.map((e) =>
                  e.id === experienceId ? updateExperience(e) : e,
                ),
              })),
            };
          });
        }
      });

      // const previousData = {
      //   byId: utils.experiences.byId.getData({ id }),
      //   feed: utils.experiences.feed.getInfiniteData(),
      //   search:
      //     pathQ || pathScheduledAt || pathTags
      //       ? utils.experiences.search.getInfiniteData({
      //           q: pathQ,
      //           scheduledAt: pathScheduledAt,
      //           tags: pathTags,
      //         })
      //       : undefined,
      //   favorites: utils.experiences.favorites.getInfiniteData(),
      //   byUserId: pathUserId
      //     ? utils.users.experiences.getInfiniteData({ id: pathUserId })
      //     : undefined,
      //   byTagId: pathTagId
      //     ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
      //     : undefined,
      // };

      // utils.experiences.byId.setData({ id }, (oldData) => {
      //   if (!oldData) {
      //     return;
      //   }

      //   return updateExperience(oldData);
      // });

      // utils.experiences.feed.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
      //     if (!oldData) {
      //       return { pages: [], pageParams: [] };
      //     }

      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map((page) => ({
      //         ...page,
      //         experiences: page.experiences.map((e) =>
      //           e.id === experienceId ? updateExperience(e) : e,
      //         ),
      //       })),
      //     };
      //   });
      // }

      return { previousData };
    },
    onError: (error, __, context) => {
      optimisticUpdates.forEach(({ key, procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, context?.previousData[key]);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, context?.previousData[key]);
        }
      });

      // utils.experiences.byId.setData({ id }, context?.previousData.byId);

      // utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     context?.previousData.search,
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData(
      //   {},
      //   context?.previousData.favorites,
      // );

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     context?.previousData.byUserId,
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData(
      //     { id: pathTagId },
      //     context?.previousData.byTagId,
      //   );
      // }

      toast({
        title: "Failed to unattend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = trpc.experiences.delete.useMutation({
    onMutate: async ({ id }) => {
      optimisticUpdates.forEach(({ procedure, args }) =>
        procedure.cancel(args),
      );

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args, type }) => ({
          [key]:
            type === "query"
              ? procedure.getData(args)
              : procedure.getInfiniteData(args),
        }),
      );

      // await Promise.all([
      //   utils.experiences.byId.cancel({ id }),
      //   utils.experiences.feed.cancel(),
      //   pathQ || pathScheduledAt || pathTags
      //     ? utils.experiences.search.cancel({
      //         q: pathQ,
      //         scheduledAt: pathScheduledAt,
      //         tags: pathTags,
      //       })
      //     : undefined,
      //   utils.experiences.favorites.cancel(),
      //   pathUserId
      //     ? utils.users.experiences.cancel({ id: pathUserId })
      //     : undefined,
      //   pathTagId
      //     ? utils.tags.experiences.cancel({ id: pathTagId })
      //     : undefined,
      // ]);

      // const previousData = {
      //   byId: utils.experiences.byId.getData({ id }),
      //   feed: utils.experiences.feed.getInfiniteData(),
      //   search:
      //     pathQ || pathScheduledAt || pathTags
      //       ? utils.experiences.search.getInfiniteData({
      //           q: pathQ,
      //           scheduledAt: pathScheduledAt,
      //           tags: pathTags,
      //         })
      //       : undefined,
      //   favorites: utils.experiences.favorites.getInfiniteData(),
      //   byUserId: pathUserId
      //     ? utils.users.experiences.getInfiniteData({ id: pathUserId })
      //     : undefined,
      //   byTagId: pathTagId
      //     ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
      //     : undefined,
      // };

      optimisticUpdates.forEach(({ procedure, args, type }) => {
        if (type === "query") {
          procedure.reset(args);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.filter((e) => e.id !== id),
              })),
            };
          });
        }
      });

      // utils.experiences.byId.reset({ id });

      // utils.experiences.feed.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.filter((e) => e.id !== id),
      //     })),
      //   };
      // });

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.filter((e) => e.id !== id),
      //         })),
      //       };
      //     },
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.filter((e) => e.id !== id),
      //     })),
      //   };
      // });

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.filter((e) => e.id !== id),
      //         })),
      //       };
      //     },
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
      //     if (!oldData) {
      //       return { pages: [], pageParams: [] };
      //     }

      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map((page) => ({
      //         ...page,
      //         experiences: page.experiences.filter((e) => e.id !== id),
      //       })),
      //     };
      //   });
      // }

      const { dismiss } = toast({
        title: "Experience deleted",
        description: "Your experience has been deleted",
      });

      return { dismiss, previousData };
    },
    onSuccess: () => {
      options.delete?.onSuccess?.();
    },
    onError: (error, { id }, context) => {
      context?.dismiss();

      optimisticUpdates.forEach(({ key, procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, context?.previousData[key]);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, context?.previousData[key]);
        }
      });

      // utils.experiences.byId.setData({ id }, context?.previousData.byId);

      // utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     context?.previousData.search,
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData(
      //   {},
      //   context?.previousData.favorites,
      // );

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     context?.previousData.byUserId,
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData(
      //     { id: pathTagId },
      //     context?.previousData.byTagId,
      //   );
      // }

      toast({
        title: "Failed to delete experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = trpc.experiences.favorite.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<T extends { isFavorited: boolean }>(
        oldData: T,
      ) {
        return {
          ...oldData,
          isFavorited: true,
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      // await Promise.all([
      //   utils.experiences.byId.cancel({ id }),
      //   utils.experiences.feed.cancel(),
      //   pathQ || pathScheduledAt || pathTags
      //     ? utils.experiences.search.cancel({
      //         q: pathQ,
      //         scheduledAt: pathScheduledAt,
      //         tags: pathTags,
      //       })
      //     : undefined,
      //   utils.experiences.favorites.cancel(),
      //   pathUserId
      //     ? utils.users.experiences.cancel({ id: pathUserId })
      //     : undefined,
      //   pathTagId
      //     ? utils.tags.experiences.cancel({ id: pathTagId })
      //     : undefined,
      // ]);

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args, type }) => ({
          [key]:
            type === "query"
              ? procedure.getData(args)
              : procedure.getInfiniteData(args),
        }),
      );

      // const previousData = {
      //   byId: utils.experiences.byId.getData({ id }),
      //   feed: utils.experiences.feed.getInfiniteData(),
      //   search:
      //     pathQ || pathScheduledAt || pathTags
      //       ? utils.experiences.search.getInfiniteData({
      //           q: pathQ,
      //           scheduledAt: pathScheduledAt,
      //           tags: pathTags,
      //         })
      //       : undefined,
      //   favorites: utils.experiences.favorites.getInfiniteData(),
      //   byUserId: pathUserId
      //     ? utils.users.experiences.getInfiniteData({ id: pathUserId })
      //     : undefined,
      //   byTagId: pathTagId
      //     ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
      //     : undefined,
      // };

      optimisticUpdates.forEach(({ procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, (oldData) => {
            if (!oldData) {
              return;
            }

            return updateExperience(oldData);
          });
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.map((e) =>
                  e.id === experienceId ? updateExperience(e) : e,
                ),
              })),
            };
          });
        }
      });

      // utils.experiences.byId.setData({ id }, (oldData) => {
      //   if (!oldData) {
      //     return;
      //   }

      //   return updateExperience(oldData);
      // });

      // utils.experiences.feed.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
      //     if (!oldData) {
      //       return { pages: [], pageParams: [] };
      //     }

      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map((page) => ({
      //         ...page,
      //         experiences: page.experiences.map((e) =>
      //           e.id === experienceId ? updateExperience(e) : e,
      //         ),
      //       })),
      //     };
      //   });
      // }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      optimisticUpdates.forEach(({ key, procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, context?.previousData[key]);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, context?.previousData[key]);
        }
      });

      // utils.experiences.byId.setData({ id }, context?.previousData.byId);

      // utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     context?.previousData.search,
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData(
      //   {},
      //   context?.previousData.favorites,
      // );

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     context?.previousData.byUserId,
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData(
      //     { id: pathTagId },
      //     context?.previousData.byTagId,
      //   );
      // }

      toast({
        title: "Failed to favorite experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfavoriteMutation = trpc.experiences.unfavorite.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<T extends { isFavorited: boolean }>(
        oldData: T,
      ) {
        return {
          ...oldData,
          isFavorited: false,
        };
      }

      await Promise.all(
        optimisticUpdates.map(({ procedure, args }) => procedure.cancel(args)),
      );

      // await Promise.all([
      //   utils.experiences.byId.cancel({ id }),
      //   utils.experiences.feed.cancel(),
      //   pathQ || pathScheduledAt || pathTags
      //     ? utils.experiences.search.cancel({
      //         q: pathQ,
      //         scheduledAt: pathScheduledAt,
      //         tags: pathTags,
      //       })
      //     : undefined,
      //   utils.experiences.favorites.cancel(),
      //   pathUserId
      //     ? utils.users.experiences.cancel({ id: pathUserId })
      //     : undefined,
      //   pathTagId
      //     ? utils.tags.experiences.cancel({ id: pathTagId })
      //     : undefined,
      // ]);

      const previousData = optimisticUpdates.map(
        ({ key, procedure, args, type }) => ({
          [key]:
            type === "query"
              ? procedure.getData(args)
              : procedure.getInfiniteData(args),
        }),
      );

      // const previousData = {
      //   byId: utils.experiences.byId.getData({ id }),
      //   feed: utils.experiences.feed.getInfiniteData(),
      //   search:
      //     pathQ || pathScheduledAt || pathTags
      //       ? utils.experiences.search.getInfiniteData({
      //           q: pathQ,
      //           scheduledAt: pathScheduledAt,
      //           tags: pathTags,
      //         })
      //       : undefined,
      //   favorites: utils.experiences.favorites.getInfiniteData(),
      //   byUserId: pathUserId
      //     ? utils.users.experiences.getInfiniteData({ id: pathUserId })
      //     : undefined,
      //   byTagId: pathTagId
      //     ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
      //     : undefined,
      // };

      optimisticUpdates.forEach(({ procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, (oldData) => {
            if (!oldData) {
              return;
            }

            return updateExperience(oldData);
          });
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, (oldData) => {
            if (!oldData) {
              return { pages: [], pageParams: [] };
            }

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                experiences: page.experiences.filter(
                  (e) => e.id !== experienceId,
                ),
              })),
            };
          });
        }
      });

      // utils.experiences.byId.setData({ id }, (oldData) => {
      //   if (!oldData) {
      //     return;
      //   }

      //   return updateExperience(oldData);
      // });

      // utils.experiences.feed.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.map((e) =>
      //         e.id === experienceId ? updateExperience(e) : e,
      //       ),
      //     })),
      //   };
      // });

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData({}, (oldData) => {
      //   if (!oldData) {
      //     return { pages: [], pageParams: [] };
      //   }

      //   return {
      //     ...oldData,
      //     pages: oldData.pages.map((page) => ({
      //       ...page,
      //       experiences: page.experiences.filter((e) => e.id !== experienceId),
      //     })),
      //   };
      // });

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     (oldData) => {
      //       if (!oldData) {
      //         return { pages: [], pageParams: [] };
      //       }

      //       return {
      //         ...oldData,
      //         pages: oldData.pages.map((page) => ({
      //           ...page,
      //           experiences: page.experiences.map((e) =>
      //             e.id === experienceId ? updateExperience(e) : e,
      //           ),
      //         })),
      //       };
      //     },
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
      //     if (!oldData) {
      //       return { pages: [], pageParams: [] };
      //     }

      //     return {
      //       ...oldData,
      //       pages: oldData.pages.map((page) => ({
      //         ...page,
      //         experiences: page.experiences.map((e) =>
      //           e.id === experienceId ? updateExperience(e) : e,
      //         ),
      //       })),
      //     };
      //   });
      // }

      return { previousData };
    },
    onError: (error, __, context) => {
      optimisticUpdates.forEach(({ key, procedure, args, type }) => {
        if (type === "query") {
          procedure.setData(args, context?.previousData[key]);
        }

        if (type === "infiniteQuery") {
          procedure.setInfiniteData(args, context?.previousData[key]);
        }
      });

      // utils.experiences.byId.setData({ id }, context?.previousData.byId);
      // utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      // if (pathQ || pathScheduledAt || pathTags) {
      //   utils.experiences.search.setInfiniteData(
      //     {
      //       q: pathQ,
      //       scheduledAt: pathScheduledAt,
      //       tags: pathTags,
      //     },
      //     context?.previousData.search,
      //   );
      // }

      // utils.experiences.favorites.setInfiniteData(
      //   {},
      //   context?.previousData.favorites,
      // );

      // if (pathUserId) {
      //   utils.users.experiences.setInfiniteData(
      //     { id: pathUserId },
      //     context?.previousData.byUserId,
      //   );
      // }

      // if (pathTagId) {
      //   utils.tags.experiences.setInfiniteData(
      //     { id: pathTagId },
      //     context?.previousData.byTagId,
      //   );
      // }

      toast({
        title: "Failed to unfavorite experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    attendMutation,
    unattendMutation,
    deleteMutation,
    favoriteMutation,
    unfavoriteMutation,
  };
}
