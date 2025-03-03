import Spinner from "@/features/shared/components/ui/Spinner";

import { UserWithUserContext } from "../types";
import UserCard from "./UserCard";

type UserListProps = {
  users: UserWithUserContext[];
  isLoading?: boolean;
  rightComponent?: (user: UserWithUserContext) => React.ReactNode;
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
        <UserCard key={user.id} user={user} rightComponent={rightComponent} />
      ))}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  );
}
