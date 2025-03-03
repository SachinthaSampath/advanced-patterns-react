import { Notification } from "@advanced-react/server/database/schema";
import { Link, LinkProps } from "@tanstack/react-router";
import { format } from "date-fns";

import Card from "@/features/shared/components/ui/Card";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type NotificationCardProps = {
  notification: Notification & { content: string };
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onMutate: async () => {
      await utils.notifications.feed.cancel();
      await utils.notifications.unreadCount.cancel();

      const previousData = {
        feed: utils.notifications.feed.getInfiniteData(),
        unreadCount: utils.notifications.unreadCount.getData(),
      };

      utils.notifications.feed.setInfiniteData({}, (oldData) => {
        if (!oldData)
          return {
            pages: [],
            pageParams: [],
          };

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n,
            ),
          })),
        };
      });

      utils.notifications.unreadCount.setData(undefined, (prev) =>
        prev ? Math.max(prev - 1, 0) : 0,
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      utils.notifications.feed.setInfiniteData({}, context?.previousData.feed);

      utils.notifications.unreadCount.setData(
        undefined,
        context?.previousData.unreadCount,
      );

      toast({
        title: "Error marking as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  let linkProps: Pick<LinkProps, "to" | "params"> | undefined;

  if (
    [
      "user_commented_experience",
      "user_attending_experience",
      "user_unattending_experience",
    ].includes(notification.type) &&
    notification.experienceId
  ) {
    linkProps = {
      to: "/experiences/$experienceId",
      params: { experienceId: notification.experienceId },
    };
  } else if (
    notification.type === "user_followed_user" &&
    notification.fromUserId
  ) {
    linkProps = {
      to: "/users/$userId",
      params: { userId: notification.fromUserId },
    };
  }

  return (
    <Link
      {...linkProps}
      onClick={() =>
        !notification.read && markAsRead.mutate({ id: notification.id })
      }
    >
      <Card className="flex items-center justify-between gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
        <div>
          <p className="text-gray-800 dark:text-gray-200">
            {notification.content}
          </p>
          <p className="text-sm text-gray-500">
            {format(new Date(notification.createdAt), "PPp")}
          </p>
        </div>
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-red-500" />
        )}
      </Card>
    </Link>
  );
}
