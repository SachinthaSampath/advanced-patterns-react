import { Experience, User } from "@advanced-react/server/database/schema";

import Link from "@/features/shared/components/ui/Link";
import UserAvatarList from "@/features/shared/components/UserAvatarList";

type ExperienceAttendeesProps = {
  experience: Experience & {
    user: User;
    attendees: User[];
    attendeesCount: number;
  };
};

export default function ExperienceAttendees({
  experience,
}: ExperienceAttendeesProps) {
  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="space-y-2">
        <h3 className="font-medium">Host</h3>
        <UserAvatarList users={[experience.user]} totalCount={1} />
      </div>

      <div className="space-y-2">
        <Link
          to="/experiences/$experienceId/attendees"
          params={{ experienceId: experience.id }}
          variant="secondary"
        >
          <h3 className="font-medium">
            Attendees ({experience.attendeesCount})
          </h3>
        </Link>
        {experience.attendeesCount > 0 ? (
          <UserAvatarList
            users={experience.attendees}
            totalCount={experience.attendeesCount}
          />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Be the first to attend!
          </p>
        )}
      </div>
    </div>
  );
}
