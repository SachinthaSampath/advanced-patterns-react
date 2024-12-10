import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import CommentsSection from "@/features/comment/components/CommentsSection";
import ExperienceCard from "@/features/experience/components/ExperienceCard";
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
  component: ExperienceDetails,
});

function ExperienceDetails() {
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
        <ExperienceCard experience={experienceQuery.data} />
        <CommentsSection experienceId={experienceId} />
      </div>
    </div>
  );
}
