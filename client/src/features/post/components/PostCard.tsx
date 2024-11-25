import { Post } from "@/server/src/features/post/models";

type PostCardProps = {
  post: Post;
};

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="border rounded-lg p-4 mb-4">
      <h2 className="text-xl font-bold mb-2">{post.title}</h2>
      <p className="text-gray-700 mb-2">{post.content}</p>
      <time className="text-sm text-gray-500">
        Posted on: {new Date(post.createdAt).toLocaleDateString()}
      </time>
    </article>
  );
}
