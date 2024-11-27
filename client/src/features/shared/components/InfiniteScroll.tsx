import { useEffect, useRef } from "react";

type InfiniteScrollProps = {
  children: React.ReactNode;
  hasNextPage?: boolean;
  onLoadMore: () => void;
  threshold?: number;
};

export default function InfiniteScroll({
  children,
  hasNextPage,
  onLoadMore,
  threshold = 100,
}: InfiniteScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasNextPage) {
          onLoadMore();
        }
      },
      {
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [onLoadMore, hasNextPage, threshold]);

  return (
    <div>
      {children}
      <div ref={containerRef} className="h-1" />
    </div>
  );
}
