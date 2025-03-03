import { LinkIcon, MessageSquare, Users } from "lucide-react";
import { useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
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
import UserAvatar from "@/features/user/components/UserAvatar";

import { useExperienceMutations } from "../hooks/useExperienceMutations";
import { ExperienceForList } from "../types";
import ExperienceAttendButton from "./ExperienceAttendButton";
import { ExperienceFavoriteButton } from "./ExperienceFavoriteButton";

type ExperienceCardProps = {
  experience: ExperienceForList;
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <Card className="overflow-hidden p-0">
      <ExperienceCardMedia experience={experience} />
      <div className="flex items-start gap-4 p-4">
        <ExperienceCardAvatar experience={experience} />
        <div className="w-full space-y-4">
          <ExperienceCardHeader experience={experience} />
          <ExperienceCardContent experience={experience} />
          <ExperienceCardMeta experience={experience} />
          <ExperienceCardTags experience={experience} />
          <ExperienceCardMetricButtons experience={experience} />
          <ExperienceCardActionButtons experience={experience} />
        </div>
      </div>
    </Card>
  );
}

type ExperienceCardMediaProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardMedia({ experience }: ExperienceCardMediaProps) {
  if (!experience.imageUrl) {
    return null;
  }

  return (
    <div className="aspect-video w-full">
      <img
        src={experience.imageUrl}
        alt={experience.title}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

type ExperienceCardAvatarProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardAvatar({ experience }: ExperienceCardAvatarProps) {
  return (
    <Link to="/users/$userId" params={{ userId: experience.user.id }}>
      <UserAvatar user={experience.user} showName={false} />
    </Link>
  );
}

type ExperienceCardHeaderProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardHeader({ experience }: ExperienceCardHeaderProps) {
  return (
    <div>
      <Link
        variant="secondary"
        to="/users/$userId"
        params={{ userId: experience.user.id }}
        className="font-semibold"
      >
        {experience.user.name}
      </Link>
      <Link
        to="/experiences/$experienceId"
        params={{ experienceId: experience.id }}
      >
        <h2 className="text-xl font-bold">{experience.title}</h2>
      </Link>
    </div>
  );
}

type ExperienceCardContentProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardContent({ experience }: ExperienceCardContentProps) {
  return <p>{experience.content}</p>;
}

type ExperienceCardMetaProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardMeta({ experience }: ExperienceCardMetaProps) {
  return (
    <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
      <time>{new Date(experience.scheduledAt).toLocaleString()}</time>
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

type ExperienceCardTagsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardTags({ experience }: ExperienceCardTagsProps) {
  return <TagList tags={experience.tags} />;
}

type ExperienceCardMetricButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardMetricButtons({
  experience,
}: ExperienceCardMetricButtonsProps) {
  return (
    <div className="flex items-center gap-6 border-y-2 border-neutral-200 py-4 dark:border-neutral-800">
      <ExperienceFavoriteButton
        id={experience.id}
        isFavorited={experience.isFavorited}
        favoritesCount={experience.favoritesCount}
      />
      <Button variant="link" asChild>
        <Link
          to="/experiences/$experienceId/attendees"
          params={{ experienceId: experience.id }}
          variant="ghost"
        >
          <Users className="h-5 w-5" />
          <span>{experience.attendeesCount}</span>
        </Link>
      </Button>

      <Button variant="link" asChild>
        <Link
          to="/experiences/$experienceId"
          params={{ experienceId: experience.id }}
          variant="ghost"
        >
          <MessageSquare className="h-5 w-5" />
          <span>{experience.commentsCount}</span>
        </Link>
      </Button>
    </div>
  );
}

type ExperienceCardActionButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardActionButtons({
  experience,
}: ExperienceCardActionButtonsProps) {
  const { currentUser } = useCurrentUser();

  const isPostOwner = currentUser?.id === experience.userId;

  if (isPostOwner) {
    return <ExperienceCardOwnerButtons experience={experience} />;
  }

  if (currentUser) {
    return (
      <ExperienceAttendButton
        experienceId={experience.id}
        isAttending={experience.isAttending}
      />
    );
  }

  return null;
}

type ExperienceCardOwnerButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardOwnerButtons({
  experience,
}: ExperienceCardOwnerButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { deleteMutation } = useExperienceMutations(experience.id, {
    delete: {
      onSuccess: () => {
        setIsOpen(false);
      },
    },
  });

  return (
    <div className="flex gap-4">
      <Button asChild variant="link">
        <Link
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
