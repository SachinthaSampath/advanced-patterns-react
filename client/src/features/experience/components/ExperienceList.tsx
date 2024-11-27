import { Experience } from "@advanced-react/server/features/experience/models";

import ExperienceCard from "./ExperienceCard";

interface ExperienceListProps {
  isLoading?: boolean;
  experiences: Experience[];
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
          <div>Loading more...</div>
        </div>
      )}
    </div>
  );
}
