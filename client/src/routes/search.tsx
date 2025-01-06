import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
  component: Search,
});

function Search() {
  return <div className="container p-4">Hello "/search"!</div>;
}
