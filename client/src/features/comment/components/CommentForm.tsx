import { useState } from "react";

import Button from "@/features/shared/components/ui/button";

type CommentFormProps = {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
};

export default function CommentForm({
  onSubmit,
  isSubmitting,
}: CommentFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit(content);
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full p-2 border border-neutral-200 dark:border-neutral-800 rounded"
      />
      <Button type="submit" disabled={!content.trim() || isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Comment"}
      </Button>
    </form>
  );
}
