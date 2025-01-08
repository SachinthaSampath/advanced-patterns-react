import { createFileRoute } from "@tanstack/react-router";

import ExperienceForm from "@/features/experience/components/ExperienceForm";
import { router } from "@/router";

export const Route = createFileRoute("/experiences/new")({
  component: NewExperience,
});

function NewExperience() {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-feed mx-auto">
        <h1 className="mb-4 text-2xl font-bold">Create Experience</h1>
        <ExperienceForm
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
