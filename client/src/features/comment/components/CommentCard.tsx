import { Button } from "@/features/shared/components/ui/Button";
import Card from "@/features/shared/components/ui/Card";
import { useState } from "react";
import { CommentForList } from "../types";
import { CommentEditForm } from "./CommentEditForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
} from "@/features/shared/components/ui/Dialog";
import { trpc } from "@/trpc";
import { useToast } from "@/features/shared/hooks/useToast";

type CommentCardProps = {
  comment: CommentForList;
};

export function CommentCard({ comment }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <CommentEditForm comment={comment} setIsEditing={setIsEditing} />;
  }

  return (
    <Card className="spacey-y-4">
      <CommentCardHeader comment={comment} />
      <CommentCardContent comment={comment} />
      <CommentCardButtons comment={comment} setIsEditing={setIsEditing} />
    </Card>
  );
}

type CommentCardHeaderProps = Pick<CommentCardProps, "comment">;

function CommentCardHeader({ comment }: CommentCardHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div>{comment.user.name}</div>
      <time className="text-sm text-neutral-500">
        . {new Date(comment.createdAt).toLocaleDateString()}
      </time>
    </div>
  );
}

type CommentCardContentProps = Pick<CommentCardProps, "comment">;

function CommentCardContent({ comment }: CommentCardContentProps) {
  return <div>{comment.content}</div>;
}

type CommentCardButtonsProps = Pick<CommentCardProps, "comment"> & {
  setIsEditing: (isEditing: boolean) => void;
};

function CommentCardButtons({
  comment,
  setIsEditing,
}: CommentCardButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const utils = trpc.useUtils();
  const { toast } = useToast();

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.comments.byExperienceId.invalidate({
          experienceId: comment.experienceId,
        }),
        utils.experiences.feed.invalidate({}),
      ]);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted",
      });
    },
    onError: async (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-600 dark:text-neutral-400">
            Are you sure you want to delete this comment?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteMutation.mutate({ id: comment.id });
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
