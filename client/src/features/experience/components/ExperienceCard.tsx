import { Experience, Tag, User } from "@advanced-react/server/database/schema";
import { LinkIcon, MessageSquare, Users } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";
import Link from "@/features/shared/components/ui/Link";
import TagList from "@/features/tag/components/TagList";
import UserAvatar from "@/features/user/components/UserAvatar";

import { useExperienceMutations } from "../hooks/useExperienceMutations";
import ExperienceAttendButton from "./ExperienceAttendButton";

type ExperienceCardProps = {
  experience: Experience & {
    commentsCount: number;
    user: User;
    attendeesCount: number;
    attendees: User[];
    tags: Tag[];
  };
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <ExperienceCardMedia experience={experience} />
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <ExperienceCardAvatar experience={experience} />
          <div className="min-w-0 flex-1 space-y-4">
            <ExperienceCardHeader experience={experience} />
            <ExperienceCardContent experience={experience} />
            <ExperienceCardButtons experience={experience} />
          </div>
        </div>
      </div>
    </article>
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
    <Link
      to="/users/$userId"
      params={{ userId: experience.user.id }}
      activeProps={{ className: undefined }}
    >
      <UserAvatar user={experience.user} showName={false} />
    </Link>
  );
}

type ExperienceCardHeaderProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardHeader({ experience }: ExperienceCardHeaderProps) {
  const { currentUser } = useCurrentUser();

  const isPostOwner = currentUser?.id === experience.userId;

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-1">
          <Link
            variant="secondary"
            to="/users/$userId"
            params={{ userId: experience.user.id }}
            activeProps={{ className: undefined }}
          >
            <span className="font-semibold">{experience.user.name}</span>
          </Link>
        </div>
        <Link
          to="/experiences/$experienceId"
          params={{ experienceId: experience.id }}
          className="block hover:no-underline"
          activeProps={{ className: undefined }}
        >
          <h2 className="text-xl font-bold hover:underline">
            {experience.title}
          </h2>
        </Link>
      </div>
      {isPostOwner && <ExperienceCardOwnerButtons experience={experience} />}
    </div>
  );
}

type ExperienceCardContentProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardContent({ experience }: ExperienceCardContentProps) {
  return (
    <div className="space-y-4">
      <p className="line-clamp-2 text-neutral-800 dark:text-neutral-100">
        {experience.content}
      </p>

      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <time>{new Date(experience.scheduledAt).toLocaleString()}</time>
        {experience.url && (
          <a
            href={experience.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
          >
            <LinkIcon size={14} />
            Event Details
          </a>
        )}
      </div>
      <TagList tags={experience.tags} />
    </div>
  );
}

type ExperienceCardButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardButtons({ experience }: ExperienceCardButtonsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <span>{experience.attendeesCount}</span>
      </div>

      <Button variant="link" asChild>
        <Link
          to="/experiences/$experienceId"
          params={{ experienceId: experience.id }}
          variant="ghost"
          activeProps={{ className: undefined }}
        >
          <MessageSquare className="h-5 w-5" />
          <span>{experience.commentsCount}</span>
        </Link>
      </Button>

      <ExperienceAttendButton experience={experience} />
    </div>
  );
}

type ExperienceCardOwnerButtonsProps = Pick<ExperienceCardProps, "experience">;

function ExperienceCardOwnerButtons({
  experience,
}: ExperienceCardOwnerButtonsProps) {
  const { deleteMutation } = useExperienceMutations(experience.id);

  return (
    <div className="flex gap-2">
      <Button asChild variant="link">
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
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
