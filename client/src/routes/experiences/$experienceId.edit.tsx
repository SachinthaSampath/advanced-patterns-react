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
    return;
  },
  component: EditExperience,
});

function EditExperience() {
  const { experienceId } = Route.useParams();
  const navigate = Route.useNavigate();
  const utils = trpc.useUtils();

  const experienceQuery = trpc.experiences.byId.useQuery({ id: experienceId });
  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess: () => {
      utils.experiences.feed.invalidate();
      utils.experiences.byId.invalidate({ id: experienceId });
      navigate({ to: "/" });
    },
  });

  if (experienceQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (!experienceQuery.data) {
    return <div>Experience not found</div>;
  }

  const handleSubmit = (data: { title: string; content: string }) => {
    editMutation.mutate({
      id: experienceId,
      ...data,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-4 text-2xl font-bold">Edit Experience</h1>
        <ExperienceForm
          initialData={experienceQuery.data}
          onSubmit={handleSubmit}
          isSubmitting={editMutation.isPending}
          onCancel={() => navigate({ to: "/" })}
        />
      </div>
    </div>
  );
}
