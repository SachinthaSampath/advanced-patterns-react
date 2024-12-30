import type { Experience } from "@advanced-react/server/features/experience/models";
import { experienceValidationSchema } from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/features/shared/components/ui/Button";
import { DateTimePicker } from "@/features/shared/components/ui/DateTimePicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/shared/components/ui/form";
import Input from "@/features/shared/components/ui/Input";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type ExperienceFormData = z.infer<typeof experienceValidationSchema>;

type ExperienceEditFormProps = {
  experience: Experience;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ExperienceEditForm({
  experience,
  onSuccess,
  onCancel,
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

  function onSubmit(data: ExperienceFormData) {
    editMutation.mutate({
      id: experience.id,
      ...data,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <TextArea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <DateTimePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={editMutation.isPending}>
            {editMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
