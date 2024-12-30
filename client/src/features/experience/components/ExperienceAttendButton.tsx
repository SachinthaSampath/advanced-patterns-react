import { Experience, User } from "@advanced-react/server/database/schema";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import Button from "@/features/shared/components/ui/Button";

import { useExperienceMutations } from "../hooks/useExperienceMutations";

type ExperienceAttendButtonProps = {
  experience: Experience & {
    attendees: User[];
  };
};

export default function ExperienceAttendButton({
  experience,
}: ExperienceAttendButtonProps) {
  const { currentUser } = useCurrentUser();

  const { attendMutation, unattendMutation } = useExperienceMutations(
    experience.id,
  );

  const isAttending = experience.attendees.some(
    (a) => a.id === currentUser?.id,
  );

  if (!currentUser || currentUser.id === experience.userId) {
    return null;
  }

  return (
    <Button
      variant={isAttending ? "outline" : "default"}
      onClick={() => {
        if (isAttending) {
          unattendMutation.mutate({ id: experience.id });
        } else {
          attendMutation.mutate({ id: experience.id });
        }
      }}
      disabled={attendMutation.isPending || unattendMutation.isPending}
    >
      {isAttending ? "Not Going" : "Going"}
    </Button>
  );
}
