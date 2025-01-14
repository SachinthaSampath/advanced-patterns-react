import { Experience, Tag, User } from "@advanced-react/server/database/schema";
import { LocationData } from "@advanced-react/shared/schema/experience";
import { Link as LinkIcon } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import LocationDisplay from "@/features/shared/components/map/LocationDisplay";
import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import TagList from "@/features/tag/components/TagList";
import { router } from "@/router";

import { useExperienceMutations } from "../hooks/useExperienceMutations";
import ExperienceAttendButton from "./ExperienceAttendButton";
import ExperienceAttendees from "./ExperienceAttendees";
import { FavoriteButton } from "./FavoriteButton";

type ExperienceDetailsProps = {
  experience: Experience & {
    commentsCount: number;
    user: User;
    attendeesCount: number;
    attendees: User[];
    tags: Tag[];
    isFavorited: boolean;
  };
};

export default function ExperienceDetails({
  experience,
}: ExperienceDetailsProps) {
  return (
    <article className="space-y-6">
      <ExperienceDetailsMedia experience={experience} />
      <div className="space-y-4">
        <ExperienceDetailsHeader experience={experience} />
        <ExperienceDetailsContent experience={experience} />
        <ExperienceAttendees experience={experience} />
        <ExperienceButtons experience={experience} />
      </div>
    </article>
  );
}

type ExperienceDetailsMediaProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsMedia({ experience }: ExperienceDetailsMediaProps) {
  if (!experience.imageUrl) {
    return null;
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg">
      <img
        src={experience.imageUrl}
        alt={experience.title}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

type ExperienceDetailsHeaderProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsHeader({ experience }: ExperienceDetailsHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <h1 className="text-2xl font-bold">{experience.title}</h1>
    </div>
  );
}

type ExperienceDetailsContentProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsContent({
  experience,
}: ExperienceDetailsContentProps) {
  const location = experience.location
    ? (JSON.parse(experience.location) as LocationData)
    : null;

  return (
    <div className="space-y-4">
      <p className="text-lg text-neutral-600 dark:text-neutral-400">
        {experience.content}
      </p>

      <TagList tags={experience.tags} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Scheduled for:</span>
          <time className="text-neutral-600 dark:text-neutral-400">
            {new Date(experience.scheduledAt).toLocaleString()}
          </time>
        </div>

        {experience.url && (
          <div className="flex items-center gap-2">
            <LinkIcon
              size={16}
              className="text-neutral-600 dark:text-neutral-400"
            />
            <a
              href={experience.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Event Details
            </a>
          </div>
        )}
      </div>

      {location && <LocationDisplay location={location} />}
    </div>
  );
}

type ExperienceButtonsProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceButtons({ experience }: ExperienceButtonsProps) {
  const { currentUser } = useCurrentUser();
  const isPostOwner = currentUser?.id === experience.userId;

  return (
    <div className="flex items-center gap-4">
      {isPostOwner ? (
        <ExperienceOwnerButtons experience={experience} />
      ) : (
        <>
          <FavoriteButton
            experienceId={experience.id}
            isFavorited={experience.isFavorited}
          />
          <ExperienceAttendButton experience={experience} />
        </>
      )}
    </div>
  );
}

type ExperienceOwnerButtonsProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceOwnerButtons({ experience }: ExperienceOwnerButtonsProps) {
  const { deleteMutation } = useExperienceMutations(experience.id, {
    delete: {
      onSuccess: () => {
        router.history.back();
      },
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild>
        <Link
          to="/experiences/$experienceId/edit"
          params={{ experienceId: experience.id }}
        >
          Edit
        </Link>
      </Button>
      <Button
        variant="destructive-link"
        onClick={() => {
          if (
            window.confirm("Are you sure you want to delete this experience?")
          ) {
            deleteMutation.mutate({ id: experience.id });
          }
        }}
        disabled={deleteMutation.isPending}
      >
        Delete
      </Button>
    </div>
  );
}
