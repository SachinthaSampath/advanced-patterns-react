import { User } from "@advanced-react/server/database/schema";

import Link from "@/features/shared/components/ui/Link";

import UserAvatar from "./UserAvatar";

type UserListProps = {
  users: (User & { isFollowing: boolean })[];
  isLoading?: boolean;
  rightComponent?: (user: User & { isFollowing: boolean }) => React.ReactNode;
};

export default function UserList({
  users,
  isLoading,
  rightComponent,
}: UserListProps) {
  if (!isLoading && users.length === 0) {
    return <div>No users found</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <Link key={user.id} to="/users/$userId" params={{ userId: user.id }}>
            <UserAvatar user={user} />
          </Link>
          {rightComponent?.(user)}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div>Loading...</div>
        </div>
      )}
    </div>
  );
}
