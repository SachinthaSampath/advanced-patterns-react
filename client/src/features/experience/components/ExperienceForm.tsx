import type { Experience } from "@advanced-react/server/features/experience/models";
import { experienceSchema } from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import FormField from "@/features/shared/components/FormField";
import Button from "@/features/shared/components/ui/Button";
import Input from "@/features/shared/components/ui/Input";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type ExperienceFormData = z.infer<typeof experienceSchema>;

type ExperienceFormProps = {
  experience: Experience;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ExperienceForm({
  experience,
  onSuccess,
  onCancel,
}: ExperienceFormProps) {
  const { toast } = useToast();

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: experience,
  });

  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess,
  });

  async function onSubmit(data: ExperienceFormData) {
    try {
      await editMutation.mutateAsync(data);
    } catch {
      toast({
        title: "Failed to edit experience",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField<ExperienceFormData> name="title" label="Title">
          {({ error, name }) => (
            <Input
              {...form.register(name)}
              error={error}
              disabled={editMutation.isPending}
            />
          )}
        </FormField>

        <FormField<ExperienceFormData> name="content" label="Content">
          {({ error, name }) => (
            <TextArea
              {...form.register(name)}
              rows={4}
              error={error}
              disabled={editMutation.isPending}
            />
          )}
        </FormField>

        <div className="flex gap-2">
          <Button type="submit" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
