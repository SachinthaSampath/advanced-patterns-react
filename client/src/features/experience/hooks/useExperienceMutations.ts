import { Experience } from "@advanced-react/server/database/schema";
import { User } from "@advanced-react/server/features/auth/models";
import { useParams, useSearch } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type ExperienceMutationsOptions = {
  add?: {
    onSuccess?: (id: Experience["id"]) => void;
  };
  edit?: {
    onSuccess?: (id: Experience["id"]) => void;
  };
  delete?: {
    onMutate?: (id: Experience["id"]) => void;
    onSuccess?: (id: Experience["id"]) => void;
  };
  kick?: {
    onSuccess?: () => void;
  };
};

export function useExperienceMutations(
  experienceId: Experience["id"] | undefined,
  options: ExperienceMutationsOptions = {},
) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { experienceId: pathExperienceId } = useParams({ strict: false });
  const { userId: pathUserId } = useParams({ strict: false });
  const { tagId: pathTagId } = useParams({ strict: false });

  const { q: pathQ } = useSearch({ strict: false });
  const { scheduledAt: pathScheduledAt } = useSearch({ strict: false });
  const { tags: pathTags } = useSearch({ strict: false });

  const addMutation = trpc.experiences.add.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Experience created",
        description: "Your experience has been created",
      });

      options.add?.onSuccess?.(data[0].id);
    },
    onError: (error) => {
      toast({
        title: "Failed to create experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Experience updated",
        description: "Your experience has been updated",
      });

      options.edit?.onSuccess?.(data[0].id);
    },
    onError: (error) => {
      toast({
        title: "Failed to edit experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const attendMutation = trpc.experiences.attend.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser) {
        return;
      }

      function updateExperience<
        T extends {
          isAttending: boolean;
          attendeesCount: number;
          attendees?: User[];
        },
      >(oldData: T) {
        return {
          ...oldData,
          isAttending: true,
          attendeesCount: oldData.attendeesCount + 1,
          ...(oldData.attendees && {
            attendees: [currentUser, ...oldData.attendees],
          }),
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt || pathTags
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            })
          : undefined,
        utils.experiences.favorites.cancel(),
        pathUserId
          ? utils.experiences.byUserId.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.experiences.byTagId.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt || pathTags
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
                tags: pathTags,
              })
            : undefined,
        favorites: utils.experiences.favorites.getInfiniteData(),
        byUserId: pathUserId
          ? utils.experiences.byUserId.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.experiences.byTagId.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
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

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          (oldData) => {
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
          },
        );
      }

      utils.experiences.favorites.setInfiniteData({}, (oldData) => {
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

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
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
          },
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          (oldData) => {
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
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          context?.previousData.search,
        );
      }

      utils.experiences.favorites.setInfiniteData(
        {},
        context?.previousData.favorites,
      );

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          context?.previousData.byTagId,
        );
      }

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
        T extends {
          isAttending: boolean;
          attendeesCount: number;
          attendees?: User[];
        },
      >(oldData: T) {
        return {
          ...oldData,
          isAttending: false,
          attendeesCount: Math.max(0, oldData.attendeesCount - 1),
          ...(oldData.attendees && {
            attendees: oldData.attendees.filter(
              (a) => a.id !== currentUser?.id,
            ),
          }),
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt || pathTags
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            })
          : undefined,
        utils.experiences.favorites.cancel(),
        pathUserId
          ? utils.experiences.byUserId.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.experiences.byTagId.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt || pathTags
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
                tags: pathTags,
              })
            : undefined,
        favorites: utils.experiences.favorites.getInfiniteData(),
        byUserId: pathUserId
          ? utils.experiences.byUserId.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.experiences.byTagId.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
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

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          (oldData) => {
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
          },
        );
      }

      utils.experiences.favorites.setInfiniteData({}, (oldData) => {
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

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
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
          },
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          (oldData) => {
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
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          context?.previousData.search,
        );
      }

      utils.experiences.favorites.setInfiniteData(
        {},
        context?.previousData.favorites,
      );

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          context?.previousData.byTagId,
        );
      }

      toast({
        title: "Failed to unattend experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = trpc.experiences.delete.useMutation({
    onMutate: async ({ id }) => {
      await Promise.all([
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt || pathTags
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            })
          : undefined,
        utils.experiences.favorites.cancel(),
        pathUserId
          ? utils.experiences.byUserId.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.experiences.byTagId.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt || pathTags
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
                tags: pathTags,
              })
            : undefined,
        favorites: utils.experiences.favorites.getInfiniteData(),
        byUserId: pathUserId
          ? utils.experiences.byUserId.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.experiences.byTagId.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
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

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          (oldData) => {
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
          },
        );
      }

      utils.experiences.favorites.setInfiniteData({}, (oldData) => {
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

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
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
          },
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          (oldData) => {
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
          },
        );
      }

      let dismissFn: (() => void) | undefined = undefined;
      if (!pathExperienceId) {
        const { dismiss } = toast({
          title: "Experience deleted",
          description: "Your experience has been deleted",
        });

        dismissFn = dismiss;
      }

      options.delete?.onMutate?.(id);

      return { dismiss: dismissFn, previousData };
    },
    onSuccess: (id) => {
      if (pathExperienceId) {
        toast({
          title: "Experience deleted",
          description: "Your experience has been deleted",
        });
      }

      options.delete?.onSuccess?.(id);
    },
    onError: (error, _, context) => {
      context?.dismiss?.();

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          context?.previousData.search,
        );
      }

      utils.experiences.favorites.setInfiniteData(
        {},
        context?.previousData.favorites,
      );

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          context?.previousData.byTagId,
        );
      }

      toast({
        title: "Failed to delete experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = trpc.experiences.favorite.useMutation({
    onMutate: async ({ id }) => {
      function updateExperience<
        T extends { isFavorited: boolean; favoritesCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isFavorited: true,
          favoritesCount: oldData.favoritesCount + 1,
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt || pathTags
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            })
          : undefined,
        utils.experiences.favorites.cancel(),
        pathUserId
          ? utils.experiences.byUserId.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.experiences.byTagId.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt || pathTags
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
                tags: pathTags,
              })
            : undefined,
        favorites: utils.experiences.favorites.getInfiniteData(),
        byUserId: pathUserId
          ? utils.experiences.byUserId.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.experiences.byTagId.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
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

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          (oldData) => {
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
          },
        );
      }

      utils.experiences.favorites.setInfiniteData({}, (oldData) => {
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

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
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
          },
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          (oldData) => {
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
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          context?.previousData.search,
        );
      }

      utils.experiences.favorites.setInfiniteData(
        {},
        context?.previousData.favorites,
      );

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          context?.previousData.byTagId,
        );
      }

      toast({
        title: "Failed to favorite experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfavoriteMutation = trpc.experiences.unfavorite.useMutation({
    onMutate: async ({ id }) => {
      function updateExperience<
        T extends { isFavorited: boolean; favoritesCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isFavorited: false,
          favoritesCount: oldData.favoritesCount - 1,
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt || pathTags
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
              tags: pathTags,
            })
          : undefined,
        utils.experiences.favorites.cancel(),
        pathUserId
          ? utils.experiences.byUserId.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.experiences.byTagId.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt || pathTags
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
                tags: pathTags,
              })
            : undefined,
        favorites: utils.experiences.favorites.getInfiniteData(),
        byUserId: pathUserId
          ? utils.experiences.byUserId.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.experiences.byTagId.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateExperience(oldData);
      });

      utils.experiences.feed.setInfiniteData({}, (oldData) => {
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

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          (oldData) => {
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
          },
        );
      }

      utils.experiences.favorites.setInfiniteData({}, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            experiences: page.experiences.filter((e) => e.id !== experienceId),
          })),
        };
      });

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          (oldData) => {
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
          },
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          (oldData) => {
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
          },
        );
      }

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);
      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt || pathTags) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
            tags: pathTags,
          },
          context?.previousData.search,
        );
      }

      utils.experiences.favorites.setInfiniteData(
        {},
        context?.previousData.favorites,
      );

      if (pathUserId) {
        utils.experiences.byUserId.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.experiences.byTagId.setInfiniteData(
          { id: pathTagId },
          context?.previousData.byTagId,
        );
      }

      toast({
        title: "Failed to unfavorite experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const kickMutation = trpc.experiences.kickAttendee.useMutation({
    onMutate: async ({ userId, experienceId }) => {
      await utils.users.experienceAttendees.cancel();

      const prevData = utils.users.experienceAttendees.getInfiniteData({
        experienceId,
      });

      utils.users.experienceAttendees.setInfiniteData(
        { experienceId },
        (old) => {
          if (!old) {
            return {
              pages: [],
              pageParams: [],
            };
          }

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              attendees: page.attendees.filter(
                (attendee) => attendee.id !== userId,
              ),
              attendeesCount: page.attendeesCount - 1,
            })),
          };
        },
      );

      return { prevData };
    },
    onError: (_, { experienceId }, context) => {
      if (context?.prevData) {
        utils.users.experienceAttendees.setInfiniteData(
          { experienceId },
          context.prevData,
        );
      }
    },
    onSuccess: () => {
      options.kick?.onSuccess?.();
    },
  });

  return {
    addMutation,
    editMutation,
    attendMutation,
    unattendMutation,
    deleteMutation,
    favoriteMutation,
    unfavoriteMutation,
    kickMutation,
  };
}
