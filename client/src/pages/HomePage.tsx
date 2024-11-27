import { useCallback, useMemo } from "react";

import PostList from "@/features/post/components/PostList";
import InfiniteScroll from "@/features/shared/components/InfiniteScroll";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils/cn";

export default function HomePage() {
  const postsQuery = trpc.posts.feed.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  const handleLoadMore = useCallback(() => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      postsQuery.fetchNextPage();
    }
  }, [postsQuery]);

  const posts = useMemo(() => {
    return postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  }, [postsQuery.data]);

  if (postsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className={cn("flex flex-col gap-4 max-w-feed mx-auto")}>
        <InfiniteScroll
          onLoadMore={handleLoadMore}
          hasNextPage={postsQuery.hasNextPage}
        >
          <PostList posts={posts} isLoading={postsQuery.isFetchingNextPage} />
        </InfiniteScroll>
      </div>
    </div>
  );
}
