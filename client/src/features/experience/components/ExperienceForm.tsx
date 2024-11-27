import { Experience } from "@advanced-react/server/features/experience/models";
import { useState } from "react";

type ExperienceFormProps = {
  initialData: Experience;
  onSubmit: (data: { title: string; content: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export default function ExperienceForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: ExperienceFormProps) {
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSubmit({
      title,
      content,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-lg border p-4">
      <div className="mb-4">
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded border p-2"
          rows={3}
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
