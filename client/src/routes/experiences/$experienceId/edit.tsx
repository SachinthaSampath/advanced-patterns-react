import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

import ExperienceForm from "@/features/experience/components/ExperienceForm";
import { QueryErrorFallback } from "@/features/shared/components/QueryErrorFallback";
import { router, trpc } from "@/router";

export const Route = createFileRoute("/experiences/$experienceId/edit")({
  parseParams: (params) => ({
    experienceId: z.coerce.number().parse(params.experienceId),
  }),
  beforeLoad: async ({ params, context: { trpcQueryUtils } }) => {
    const { currentUser } = await trpcQueryUtils.auth.currentUser.ensureData();

    const experience = await trpcQueryUtils.experiences.byId.ensureData({
      id: params.experienceId,
    });

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

  if (experienceQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (experienceQuery.isError) {
    return <QueryErrorFallback refetch={experienceQuery.refetch} />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-4 text-2xl font-bold">Edit Experience</h1>
        <ExperienceForm
          experience={experienceQuery.data}
          onSuccess={(id) =>
            router.navigate({
              to: "/experiences/$experienceId",
              params: { experienceId: id },
            })
          }
          onCancel={() => router.history.back()}
        />
      </div>
    </div>
  );
}
