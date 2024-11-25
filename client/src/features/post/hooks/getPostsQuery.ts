import { useQuery } from "@tanstack/react-query";

export function useGetPostsQuery() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () =>
      fetch("http://localhost:3000/api/posts").then((res) => res.json()),
  });
}
