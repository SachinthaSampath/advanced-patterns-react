import { Comment } from "@advanced-react/server/features/comment/models";
import { useState } from "react";

import { trpc } from "@/lib/trpc";

type CommentItemProps = {
  comment: Comment;
  onCommentUpdated: () => void;
};

export default function CommentItem({
  comment,
  onCommentUpdated,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.byPostId.invalidate({ postId: comment.postId });
      onCommentUpdated();
    },
  });

  const editMutation = trpc.comments.edit.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.comments.byPostId.invalidate({ postId: comment.postId });
      onCommentUpdated();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    editMutation.mutate({
      id: comment.id,
      content: editContent,
    });
  };

  if (isEditing) {
    return (
      <form onSubmit={handleEdit} className="p-2 bg-gray-50 rounded">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={editMutation.isPending}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {editMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-2 bg-gray-50 rounded">
      <p className="text-gray-800">{comment.content}</p>
      <div className="flex items-center justify-between mt-1">
        <time className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </time>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-xs text-red-500 hover:text-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
