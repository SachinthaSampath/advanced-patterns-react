import { useParams } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

import { getUserQueries } from "../utils/mutations";

type FollowButtonProps = {
  userId: number;
  isFollowing: boolean;
};

export default function FollowButton({
  userId,
  isFollowing,
}: FollowButtonProps) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { userId: pathUserId } = useParams({ strict: false });

  const followMutation = trpc.users.follow.useMutation({
    onMutate: async () => {
      if (!currentUser || !pathUserId) {
        return;
      }

      const { byId, lists } = getUserQueries(utils);

      await Promise.all([
        ...byId.map((query) => query.cancel()),
        ...lists.map((query) => query.cancel()),
      ]);

      const previousData = {
        byId: byId.map((query) => ({
          query,
          data: query.getData({ id: userId }),
        })),
        lists: lists.map((query) => ({
          query,
          data: query.getInfiniteData({ userId: pathUserId }),
        })),
      };

      lists.forEach((query) =>
        query.setInfiniteData({ userId: pathUserId }, (oldData) => {
          if (!oldData) {
            return { pages: [], pageParams: [] };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((user) =>
                user.id === userId
                  ? {
                      ...user,
                      isFollowing: true,
                      followersCount: user.followersCount + 1,
                    }
                  : user,
              ),
            })),
          };
        }),
      );

      byId.forEach((query) =>
        query.setData({ id: userId }, (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            isFollowing: true,
            followersCount: oldData.followersCount + 1,
          };
        }),
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      if (!pathUserId) {
        return;
      }

      context?.previousData.byId.forEach(({ query, data }) => {
        query.setData({ id: userId }, data);
      });

      context?.previousData.lists.forEach(({ query, data }) => {
        query.setInfiniteData({ userId: pathUserId }, data);
      });

      toast({
        title: "Failed to follow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onMutate: async () => {
      if (!currentUser || !pathUserId) {
        return;
      }

      const { byId, lists } = getUserQueries(utils);

      await Promise.all([
        ...byId.map((query) => query.cancel()),
        ...lists.map((query) => query.cancel()),
      ]);

      const previousData = {
        byId: byId.map((query) => ({
          query,
          data: query.getData({ id: userId }),
        })),
        lists: lists.map((query) => ({
          query,
          data: query.getInfiniteData({ userId: pathUserId }),
        })),
      };

      lists.forEach((query) =>
        query.setInfiniteData({ userId: pathUserId }, (oldData) => {
          if (!oldData) {
            return { pages: [], pageParams: [] };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((user) =>
                user.id === userId
                  ? {
                      ...user,
                      isFollowing: false,
                      followersCount: user.followersCount - 1,
                    }
                  : user,
              ),
            })),
          };
        }),
      );

      byId.forEach((query) =>
        query.setData({ id: userId }, (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            isFollowing: false,
            followersCount: Math.max(0, oldData.followersCount - 1),
          };
        }),
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      if (!pathUserId) {
        return;
      }

      context?.previousData.byId.forEach(({ query, data }) => {
        query.setData({ id: userId }, data);
      });

      context?.previousData.lists.forEach(({ query, data }) => {
        query.setInfiniteData({ userId: pathUserId }, data);
      });

      toast({
        title: "Failed to unfollow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!currentUser || currentUser.id === userId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={(e) => {
        e.preventDefault();

        if (isFollowing) {
          unfollowMutation.mutate({ userId });
        } else {
          followMutation.mutate({ userId });
        }
      }}
      disabled={followMutation.isPending || unfollowMutation.isPending}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
