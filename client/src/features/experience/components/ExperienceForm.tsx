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

type ExperienceFormProps = {
  experience: Experience;
};

export default function ExperienceForm({ experience }: ExperienceFormProps) {
  const { toast } = useToast();

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceValidationSchema),
    defaultValues: experience,
  });

  const utils = trpc.useUtils();

  const editMutation = trpc.experiences.edit.useMutation({
    async onSuccess() {
      await utils.experiences.feed.invalidate();
      router.history.back();
    },
    onError() {
      toast({
        title: "Failed to edit experience",
        description: "Please try again later",
        variant: "destructive",
      });
    },
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
