import { Post } from "@advanced-react/server/features/post/models";

import PostCard from "./PostCard";

interface PostListProps {
  isLoading?: boolean;
  posts: Post[];
}

export default function PostList({ posts, isLoading }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div>Loading more...</div>
        </div>
      )}
    </div>
  );
}
