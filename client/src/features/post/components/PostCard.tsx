import { Post } from "@advanced-react/server/features/post/models";
import { useState } from "react";

import CommentsSection from "@/features/comment/components/CommentsSection";
import PostForm from "@/features/post/components/PostForm";
import { trpc } from "@/lib/trpc";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const utils = trpc.useContext();

  const deleteMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      utils.posts.feed.invalidate();
    },
  });

  const editMutation = trpc.posts.edit.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      utils.posts.feed.invalidate();
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate({ id: post.id });
    }
  };

  const handleEdit = (data: { title: string; content: string }) => {
    editMutation.mutate({
      id: post.id,
      ...data,
    });
  };

  if (isEditing) {
    return (
      <PostForm
        initialData={post}
        onSubmit={handleEdit}
        isSubmitting={editMutation.isPending}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <article className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
          <p className="text-gray-700 mb-2">{post.content}</p>
          <time className="text-sm text-gray-500">
            Posted on: {new Date(post.createdAt).toLocaleDateString()}
          </time>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-sm text-red-500 hover:text-red-700"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <CommentsSection postId={post.id} />
    </article>
  );
}
