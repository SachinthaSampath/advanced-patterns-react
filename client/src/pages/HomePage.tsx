import PostList from "@/features/post/components/PostList";
import { trpc } from "@/lib/trpc";

export default function HomePage() {
  const postsQuery = trpc.posts.list.useQuery();

  if (postsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PostList posts={postsQuery.data} />
    </div>
  );
}
