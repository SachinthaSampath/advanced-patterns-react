import PostList from "@/features/post/components/PostList";
import { useGetPostsQuery } from "@/features/post/hooks/getPostsQuery";

export default function App() {
  const getPostsQuery = useGetPostsQuery();

  if (getPostsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PostList posts={getPostsQuery.data} />
    </div>
  );
}
