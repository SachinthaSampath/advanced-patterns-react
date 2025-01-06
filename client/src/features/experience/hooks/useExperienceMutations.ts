import { User } from "@advanced-react/server/database/schema";
import { useParams, useSearch } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

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

  const attendMutation = trpc.experiences.attend.useMutation({
    onMutate: async ({ id }) => {
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

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
            })
          : undefined,
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.tags.experiences.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
              })
            : undefined,
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
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

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
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

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
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
        utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
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

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
          },
          context?.previousData.search,
        );
      }

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.tags.experiences.setInfiniteData(
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
        T extends { attendeesCount: number; attendees: User[] },
      >(oldData: T) {
        return {
          ...oldData,
          attendeesCount: Math.max(0, oldData.attendeesCount - 1),
          attendees: oldData.attendees.filter((a) => a.id !== currentUser?.id),
        };
      }

      await Promise.all([
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
            })
          : undefined,
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.tags.experiences.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
              })
            : undefined,
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
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

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
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

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
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
        utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
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

      return { previousData };
    },
    onError: (error, { id }, context) => {
      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
          },
          context?.previousData.search,
        );
      }

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.tags.experiences.setInfiniteData(
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
        utils.experiences.byId.cancel({ id }),
        utils.experiences.feed.cancel(),
        pathQ || pathScheduledAt
          ? utils.experiences.search.cancel({
              q: pathQ,
              scheduledAt: pathScheduledAt,
            })
          : undefined,
        pathUserId
          ? utils.users.experiences.cancel({ id: pathUserId })
          : undefined,
        pathTagId
          ? utils.tags.experiences.cancel({ id: pathTagId })
          : undefined,
      ]);

      const previousData = {
        byId: utils.experiences.byId.getData({ id }),
        feed: utils.experiences.feed.getInfiniteData(),
        search:
          pathQ || pathScheduledAt
            ? utils.experiences.search.getInfiniteData({
                q: pathQ,
                scheduledAt: pathScheduledAt,
              })
            : undefined,
        byUserId: pathUserId
          ? utils.users.experiences.getInfiniteData({ id: pathUserId })
          : undefined,
        byTagId: pathTagId
          ? utils.tags.experiences.getInfiniteData({ id: pathTagId })
          : undefined,
      };

      utils.experiences.byId.reset({ id });

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

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
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

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
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
        utils.tags.experiences.setInfiniteData({ id: pathTagId }, (oldData) => {
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

      utils.experiences.byId.setData({ id }, context?.previousData.byId);

      utils.experiences.feed.setInfiniteData({}, context?.previousData.feed);

      if (pathQ || pathScheduledAt) {
        utils.experiences.search.setInfiniteData(
          {
            q: pathQ,
            scheduledAt: pathScheduledAt,
          },
          context?.previousData.search,
        );
      }

      if (pathUserId) {
        utils.users.experiences.setInfiniteData(
          { id: pathUserId },
          context?.previousData.byUserId,
        );
      }

      if (pathTagId) {
        utils.tags.experiences.setInfiniteData(
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

  return {
    attendMutation,
    unattendMutation,
    deleteMutation,
  };
}
