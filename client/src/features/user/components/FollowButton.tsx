import { useParams } from "@tanstack/react-router";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type FollowButtonProps = {
  targetUserId: number;
  isFollowing: boolean;
};

export default function FollowButton({
  targetUserId,
  isFollowing,
}: FollowButtonProps) {
  const { currentUser } = useCurrentUser();
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const { userId: pathUserId } = useParams({ strict: false });

  const followMutation = trpc.users.follow.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser || !pathUserId) {
        return;
      }

      function updateUser<
        T extends { isFollowing: boolean; followersCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isFollowing: true,
          followersCount: oldData.followersCount + 1,
        };
      }

      await Promise.all([
        utils.users.byId.cancel({ id: targetUserId }),
        utils.users.followers.cancel({ id: pathUserId }),
        utils.users.following.cancel({ id: pathUserId }),
      ]);

      const previousData = {
        byId: utils.users.byId.getData({ id }),
        followers: utils.users.followers.getInfiniteData({ id: pathUserId }),
        following: utils.users.following.getInfiniteData({ id: pathUserId }),
      };

      utils.users.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateUser(oldData);
      });

      utils.users.followers.setInfiniteData({ id: pathUserId }, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((user) =>
              user.id === id ? updateUser(user) : user,
            ),
          })),
        };
      });

      utils.users.following.setInfiniteData({ id: pathUserId }, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((user) =>
              user.id === id ? updateUser(user) : user,
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (error, { id }, context) => {
      if (!currentUser || !pathUserId) {
        return;
      }

      utils.users.byId.setData({ id }, context?.previousData.byId);

      utils.users.followers.setInfiniteData(
        { id: pathUserId },
        context?.previousData.followers,
      );

      utils.users.following.setInfiniteData(
        { id: pathUserId },
        context?.previousData.following,
      );

      toast({
        title: "Failed to follow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onMutate: async ({ id }) => {
      if (!currentUser || !pathUserId) {
        return;
      }

      function updateUser<
        T extends { isFollowing: boolean; followersCount: number },
      >(oldData: T) {
        return {
          ...oldData,
          isFollowing: false,
          followersCount: Math.max(0, oldData.followersCount - 1),
        };
      }

      await Promise.all([
        utils.users.byId.cancel({ id }),
        utils.users.followers.cancel({ id: pathUserId }),
        utils.users.following.cancel({ id: pathUserId }),
      ]);

      const previousData = {
        byId: utils.users.byId.getData({ id }),
        followers: utils.users.followers.getInfiniteData({ id: pathUserId }),
        following: utils.users.following.getInfiniteData({ id: pathUserId }),
      };

      utils.users.byId.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        return updateUser(oldData);
      });

      utils.users.followers.setInfiniteData({ id: pathUserId }, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((user) =>
              user.id === id ? updateUser(user) : user,
            ),
          })),
        };
      });

      utils.users.following.setInfiniteData({ id: pathUserId }, (oldData) => {
        if (!oldData) {
          return { pages: [], pageParams: [] };
        }

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((user) =>
              user.id === id ? updateUser(user) : user,
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (error, { id }, context) => {
      if (!currentUser || !pathUserId) {
        return;
      }

      utils.users.byId.setData({ id }, context?.previousData.byId);

      utils.users.followers.setInfiniteData(
        { id: pathUserId },
        context?.previousData.followers,
      );

      utils.users.following.setInfiniteData(
        { id: pathUserId },
        context?.previousData.following,
      );

      toast({
        title: "Failed to unfollow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!currentUser || currentUser.id === targetUserId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={(e) => {
        e.preventDefault();

        if (isFollowing) {
          unfollowMutation.mutate({ id: targetUserId });
        } else {
          followMutation.mutate({ id: targetUserId });
        }
      }}
      disabled={followMutation.isPending || unfollowMutation.isPending}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
