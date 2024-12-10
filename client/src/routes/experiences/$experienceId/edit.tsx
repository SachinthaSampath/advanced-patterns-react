import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceForm from "@/features/experience/components/ExperienceForm";
import { trpc } from "@/router";

export const Route = createFileRoute("/experiences/$experienceId/edit")({
  parseParams: (params) => ({
    experienceId: z.coerce.number().parse(params.experienceId),
  }),
  beforeLoad: async ({ params, context: { trpcQueryUtils } }) => {
    const experience = await trpcQueryUtils.experiences.byId.ensureData({
      id: params.experienceId,
    });

    // Get current user
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    // Redirect if not logged in or not the owner
    if (!currentUser || currentUser.id !== experience.userId) {
      throw redirect({
        to: "/experiences/$experienceId",
        params: { experienceId: params.experienceId },
      });
    }
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
