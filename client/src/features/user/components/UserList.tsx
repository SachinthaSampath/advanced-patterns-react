import { User } from "@advanced-react/server/database/schema";

import Link from "@/features/shared/components/ui/Link";

import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";

type UserListProps = {
  users: (User & { isFollowing: boolean })[];
  isLoading?: boolean;
};

export default function UserList({ users, isLoading }: UserListProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (users.length === 0) {
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
          <FollowButton userId={user.id} isFollowing={user.isFollowing} />
        </div>
      ))}
    </div>
  );
}
