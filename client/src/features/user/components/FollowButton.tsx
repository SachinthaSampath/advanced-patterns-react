import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

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

  const followMutation = trpc.users.follow.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      await utils.users.byId.cancel();

      const previousData = utils.users.byId.getData({ id: userId });

      utils.users.byId.setData({ id: userId }, (old) => {
        if (!old) {
          return;
        }

        return {
          ...old,
          isFollowing: true,
          followersCount: old.followersCount + 1,
        };
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      utils.users.byId.setData({ id: userId }, context?.previousData);

      toast({
        title: "Failed to follow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onMutate: async () => {
      if (!currentUser) {
        return;
      }

      await utils.users.byId.cancel();

      const previousData = utils.users.byId.getData({ id: userId });

      utils.users.byId.setData({ id: userId }, (old) => {
        if (!old) {
          return;
        }

        return {
          ...old,
          isFollowing: false,
          followersCount: Math.max(0, old.followersCount - 1),
        };
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      utils.users.byId.setData({ id: userId }, context?.previousData);

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
      onClick={() => {
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
