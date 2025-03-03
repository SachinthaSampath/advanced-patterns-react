import { LocationData } from "@advanced-react/shared/schema/experience";
import { LinkIcon } from "lucide-react";
import { useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import LocationDisplay from "@/features/shared/components/map/LocationDisplay";
import { Button } from "@/features/shared/components/ui/Button";
import Card from "@/features/shared/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/shared/components/ui/Dialog";
import Link from "@/features/shared/components/ui/Link";
import TagList from "@/features/tag/components/TagList";
import UserAvatarList from "@/features/user/components/UserAvatarList";
import { router } from "@/router";

import { useExperienceMutations } from "../hooks/useExperienceMutations";
import { ExperienceForDetails } from "../types";
import ExperienceAttendButton from "./ExperienceAttendButton";
import { ExperienceFavoriteButton } from "./ExperienceFavoriteButton";

type ExperienceDetailsProps = {
  experience: ExperienceForDetails;
};

export default function ExperienceDetails({
  experience,
}: ExperienceDetailsProps) {
  return (
    <Card className="p-0">
      <ExperienceDetailsMedia experience={experience} />
      <div className="space-y-4 p-4">
        <ExperienceDetailsHeader experience={experience} />
        <ExperienceDetailsContent experience={experience} />
        <ExperienceDetailsTags experience={experience} />
        <ExperienceDetailsMeta experience={experience} />
        <ExperienceDetailsButtons experience={experience} />
        <div className="border-y-2 border-neutral-200 py-4 dark:border-neutral-800">
          <ExperienceDetailsAttendees experience={experience} />
        </div>
        <ExperienceDetailsLocation experience={experience} />
      </div>
    </Card>
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
  return <h1 className="text-2xl font-bold">{experience.title}</h1>;
}

type ExperienceDetailsContentProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsContent({
  experience,
}: ExperienceDetailsContentProps) {
  return (
    <p className="text-lg text-neutral-600 dark:text-neutral-400">
      {experience.content}
    </p>
  );
}

type ExperienceDetailsTagsProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsTags({ experience }: ExperienceDetailsTagsProps) {
  return <TagList tags={experience.tags} />;
}

type ExperienceDetailsMetaProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsMeta({ experience }: ExperienceDetailsMetaProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <time className="text-neutral-600 dark:text-neutral-400">
          {new Date(experience.scheduledAt).toLocaleString()}
        </time>
      </div>

      {experience.url && (
        <div className="flex items-center gap-2">
          <LinkIcon
            size={16}
            className="text-secondary-500 dark:text-primary-500"
          />
          <a
            href={experience.url}
            target="_blank"
            className="text-secondary-500 dark:text-primary-500 hover:underline"
          >
            Event Details
          </a>
        </div>
      )}
    </div>
  );
}

type ExperienceDetailsLocationProps = Pick<
  ExperienceDetailsProps,
  "experience"
>;

function ExperienceDetailsLocation({
  experience,
}: ExperienceDetailsLocationProps) {
  const location = experience.location
    ? (JSON.parse(experience.location) as LocationData)
    : null;

  if (!location) {
    return null;
  }

  return <LocationDisplay location={location} />;
}

type ExperienceDetailsAttendeesProps = Pick<
  ExperienceDetailsProps,
  "experience"
>;

function ExperienceDetailsAttendees({
  experience,
}: ExperienceDetailsAttendeesProps) {
  return (
    <div className="space-y-4">
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
          <p className="text-neutral-600 dark:text-neutral-400">
            Be the first to attend!
          </p>
        )}
      </div>
    </div>
  );
}

type ExperienceDetailsButtonsProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceDetailsButtons({
  experience,
}: ExperienceDetailsButtonsProps) {
  const { currentUser } = useCurrentUser();

  const isPostOwner = currentUser?.id === experience.userId;

  if (isPostOwner) {
    return <ExperienceOwnerButtons experience={experience} />;
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-4">
        <ExperienceAttendButton
          experienceId={experience.id}
          isAttending={experience.isAttending}
        />
        <ExperienceFavoriteButton
          id={experience.id}
          isFavorited={experience.isFavorited}
          favoritesCount={experience.favoritesCount}
        />
      </div>
    );
  }

  return null;
}

type ExperienceOwnerButtonsProps = Pick<ExperienceDetailsProps, "experience">;

function ExperienceOwnerButtons({ experience }: ExperienceOwnerButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { deleteMutation } = useExperienceMutations(experience.id, {
    delete: {
      onSuccess: () => {
        setIsOpen(false);
        router.navigate({ to: "/" });
      },
    },
  });

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" asChild>
        <Link
          variant="ghost"
          to="/experiences/$experienceId/edit"
          params={{ experienceId: experience.id }}
        >
          Edit
        </Link>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive-link">Delete</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experience</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete this experience? This action cannot
            be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate({ id: experience.id });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
