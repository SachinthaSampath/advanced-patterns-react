import type { Experience } from "@advanced-react/server/features/experience/models";
import { experienceValidationSchema } from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { router, trpc } from "@/router";

type ExperienceFormData = z.infer<typeof experienceValidationSchema>;

type ExperienceEditFormProps = {
  experience: Experience;
  onSuccess?: () => void;
};

export default function ExperienceEditForm({
  experience,
  onSuccess,
}: ExperienceEditFormProps) {
  const { toast } = useToast();

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceValidationSchema),
    defaultValues: experience,
  });

  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess: async () => {
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to edit experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    editMutation.mutate({
      id: experience.id,
      ...data,
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField<ExperienceFormData> name="title" label="Title">
          {({ error, name }) => (
            <Input {...form.register(name)} error={error} />
          )}
        </FormField>

        <FormField<ExperienceFormData> name="content" label="Content">
          {({ error, name }) => (
            <TextArea {...form.register(name)} rows={4} error={error} />
          )}
        </FormField>

        <div className="flex gap-2">
          <Button type="submit" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.history.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
