import { Heart } from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCommentMutations } from "@/features/comment/hooks/useCommentMutations";
import Button from "@/features/shared/components/ui/Button";

type LikeButtonProps = {
  commentId: number;
  isLiked: boolean;
};

export function LikeButton({ commentId, isLiked }: LikeButtonProps) {
  const { currentUser } = useCurrentUser();

  const { likeMutation, unlikeMutation } = useCommentMutations(commentId);

  if (!currentUser) {
    return null;
  }

  return (
    <Button
      variant="link"
      onClick={() =>
        isLiked
          ? unlikeMutation.mutate({ id: commentId })
          : likeMutation.mutate({ id: commentId })
      }
      disabled={likeMutation.isPending || unlikeMutation.isPending}
    >
      <Heart
        className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
