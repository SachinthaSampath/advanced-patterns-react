import { useState } from "react";

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
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full p-2 border border-neutral-200 dark:border-neutral-800 rounded"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? "Adding..." : "Add Comment"}
      </button>
    </form>
  );
}
