import { Experience, User } from "@advanced-react/server/database/schema";

import ExperienceCard from "./ExperienceCard";

interface ExperienceListProps {
  experiences: (Experience & {
    user: User;
    commentsCount: number;
    attendeesCount: number;
    attendees: User[];
  })[];
  isLoading?: boolean;
}

export default function ExperienceList({
  experiences,
  isLoading,
}: ExperienceListProps) {
  return (
    <div className="space-y-4">
      {experiences.map((experience) => (
        <ExperienceCard key={experience.id} experience={experience} />
      ))}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div>Loading...</div>
        </div>
      )}
    </div>
  );
}
