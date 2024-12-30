import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import CommentsSection from "@/features/comment/components/CommentsSection";
import ExperienceDetails from "@/features/experience/components/ExperienceDetails";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/$experienceId/")({
  params: {
    parse: (params) => ({
      experienceId: z.coerce.number().parse(params.experienceId),
    }),
  },
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.experiences.byId.ensureData({
      id: params.experienceId,
    });
  },
  component: ExperiencePage,
});

function ExperiencePage() {
  const { experienceId } = Route.useParams();

  const experienceQuery = trpc.experiences.byId.useQuery({ id: experienceId });

  if (experienceQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (!experienceQuery.data) {
    return <div>Experience not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto space-y-4">
        <ExperienceDetails experience={experienceQuery.data} />
        <CommentsSection
          experienceId={experienceId}
          commentsCount={experienceQuery.data.commentsCount}
        />
      </div>
    </div>
  );
}
