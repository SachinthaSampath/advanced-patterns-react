import { Tag } from "@advanced-react/server/database/schema";

import Link from "@/features/shared/components/ui/Link";

type TagCardProps = {
  tag: Tag;
};

export default function TagCard({ tag }: TagCardProps) {
  return (
    <div className="rounded-full bg-neutral-900 bg-gradient-to-r px-2 py-1 text-xs font-semibold text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900">
      <Link
        to="/tags/$tagId"
        params={{ tagId: tag.id }}
        variant="ghost"
        activeProps={{ className: undefined }}
      >
        {tag.name}
      </Link>
    </div>
  );
}
