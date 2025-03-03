import { Notification } from "@advanced-react/server/database/schema";

import Spinner from "@/features/shared/components/ui/Spinner";

import { NotificationCard } from "./NotificationCard";

type NotificationListProps = {
  notifications: (Notification & { content: string })[];
  isLoading?: boolean;
};

export default function NotificationList({
  notifications,
  isLoading,
}: NotificationListProps) {
  return (
    <div className="flex flex-col gap-4">
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} />
      ))}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex justify-center py-4">No notifications yet</div>
      )}
    </div>
  );
}
