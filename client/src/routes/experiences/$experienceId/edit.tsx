import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceForm from "@/features/experience/components/ExperienceForm";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/$experienceId/edit")({
  parseParams: (params) => ({
    experienceId: z.coerce.number().parse(params.experienceId),
  }),
  loader: async ({ params, context: { trpcQueryUtils } }) => {
    await trpcQueryUtils.experiences.byId.ensureData({
      id: params.experienceId,
    });
  },
  component: EditExperience,
});

function EditExperience() {
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
      <div className="max-w-feed mx-auto">
        <h1 className="mb-4 text-2xl font-bold">Edit Experience</h1>
        <ExperienceForm experience={experienceQuery.data} />
      </div>
    </div>
  );
}
