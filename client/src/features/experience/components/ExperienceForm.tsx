import type { Experience } from "@advanced-react/server/features/experience/models";
import { experienceValidationSchema } from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/features/shared/components/ui/Button";
import { DateTimePicker } from "@/features/shared/components/ui/DateTimePicker";
import FileInput from "@/features/shared/components/ui/FileInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/shared/components/ui/Form";
import Input from "@/features/shared/components/ui/Input";
import TextArea from "@/features/shared/components/ui/TextArea";
import { useToast } from "@/features/shared/hooks/useToast";
import { trpc } from "@/router";

type ExperienceFormData = z.infer<typeof experienceValidationSchema>;

type ExperienceFormProps = {
  experience?: Experience;
  onSuccess?: (id: Experience["id"]) => void;
  onCancel?: () => void;
};

export default function ExperienceForm({
  experience,
  onSuccess,
  onCancel,
}: ExperienceFormProps) {
  const { toast } = useToast();

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceValidationSchema),
    defaultValues: experience,
  });

  const editMutation = trpc.experiences.edit.useMutation({
    onSuccess: (data) => {
      onSuccess?.(data[0].id);
    },
    onError: (error) => {
      toast({
        title: "Failed to edit experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMutation = trpc.experiences.add.useMutation({
    onSuccess: (data) => {
      onSuccess?.(data[0].id);
    },
    onError: (error) => {
      toast({
        title: "Failed to create experience",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mutation = experience ? editMutation : addMutation;

  function onSubmit(data: ExperienceFormData) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string | Blob);
      }
    }

    mutation.mutate(formData);
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

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <FileInput
                  accept="image/*"
                  value={undefined}
                  onChange={(event) => {
                    field.onChange(event.target?.files?.[0]);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : experience ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
