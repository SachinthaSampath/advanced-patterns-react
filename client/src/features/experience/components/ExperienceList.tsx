import { Experience, Tag, User } from "@advanced-react/server/database/schema";

import ExperienceCard from "./ExperienceCard";

interface ExperienceListProps {
  experiences: (Experience & {
    user: User;
    commentsCount: number;
    attendeesCount: number;
    attendees: User[];
    tags: Tag[];
  })[];
  isLoading?: boolean;
  noExperiencesMessage?: string;
}

export default function ExperienceList({
  experiences,
  isLoading,
  noExperiencesMessage,
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
      {!isLoading && experiences.length === 0 && (
        <div className="flex justify-center py-4">
          {noExperiencesMessage ?? "No experiences found"}
        </div>
      )}
    </div>
  );
}
