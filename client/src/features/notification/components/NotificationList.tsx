import { Notification } from "@advanced-react/server/database/schema";
import { Link, LinkProps } from "@tanstack/react-router";
import { format } from "date-fns";

import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type NotificationListProps = {
  notifications: (Notification & { content: string })[];
  isLoading?: boolean;
};

export default function NotificationList({
  notifications,
  isLoading,
}: NotificationListProps) {
  const { toast } = useToast();

  const utils = trpc.useUtils();

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: async () => {
      await utils.notifications.unreadCount.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error marking as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {notifications.map((notification) => {
        let linkProps: Pick<LinkProps, "to" | "params"> | undefined = undefined;

        if (
          [
            "user_commented_experience",
            "user_attending_experience",
            "user_unattending_experience",
          ].includes(notification.type) &&
          notification.experienceId
        ) {
          linkProps = {
            to: "/experiences/$experienceId" as const,
            params: { experienceId: notification.experienceId },
          };
        } else if (
          notification.type === "user_followed_user" &&
          notification.fromUserId
        ) {
          linkProps = {
            to: "/users/$userId" as const,
            params: { userId: notification.fromUserId },
          };
        }

        return (
          <Link
            key={notification.id}
            {...linkProps}
            className="group relative flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            onClick={() => {
              if (!notification.read) {
                markAsRead.mutate({ id: notification.id });
              }
            }}
          >
            <div>
              <p className="text-gray-800 dark:text-gray-200">
                {notification.content}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(notification.createdAt), "PPp")}
              </p>
            </div>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </Link>
        );
      })}

      {isLoading && (
        <div className="flex justify-center py-4">
          <div>Loading...</div>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex justify-center py-4">No notifications yet</div>
      )}
    </div>
  );
}
