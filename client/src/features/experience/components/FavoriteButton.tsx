import { Heart } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useExperienceMutations } from "@/features/experience/hooks/useExperienceMutations";
import Button from "@/features/shared/components/ui/Button";

type FavoriteButtonProps = {
  experienceId: number;
  isFavorited: boolean;
};

export function FavoriteButton({
  experienceId,
  isFavorited,
}: FavoriteButtonProps) {
  const { currentUser } = useCurrentUser();

  const { favoriteMutation, unfavoriteMutation } =
    useExperienceMutations(experienceId);

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant="link"
      onClick={() =>
        isFavorited
          ? unfavoriteMutation.mutate({ id: experienceId })
          : favoriteMutation.mutate({ id: experienceId })
      }
      disabled={favoriteMutation.isPending || unfavoriteMutation.isPending}
    >
      <Heart
        className={`h-6 w-6 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
