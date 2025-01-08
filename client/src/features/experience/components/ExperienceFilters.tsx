import {
  ExperienceFilterParams,
  experienceFiltersSchema,
} from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";

import Button from "@/features/shared/components/ui/Button";
import { DateTimePicker } from "@/features/shared/components/ui/DateTimePicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/features/shared/components/ui/Form";
import Input from "@/features/shared/components/ui/Input";
import { MultiSelect } from "@/features/shared/components/ui/MultiSelect";
import { trpc } from "@/router";

type ExperienceFiltersProps = {
  onFiltersChange: (filters: ExperienceFilterParams) => void;
  initialFilters?: ExperienceFilterParams;
};

export default function ExperienceFilters({
  onFiltersChange,
  initialFilters,
}: ExperienceFiltersProps) {
  const form = useForm<ExperienceFilterParams>({
    resolver: zodResolver(experienceFiltersSchema),
    defaultValues: initialFilters,
  });

  const tagsQuery = trpc.tags.list.useQuery();

  function handleSubmit(values: ExperienceFilterParams) {
    const filters: ExperienceFilterParams = {};

    if (values.q?.trim()) {
      filters.q = values.q.trim();
    }

    if (values.scheduledAt) {
      filters.scheduledAt = values.scheduledAt;
    }

    if (values.tags?.length) {
      filters.tags = values.tags;
    }

    onFiltersChange(filters);
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <div className="flex flex-row gap-4">
          <FormField
            control={form.control}
            name="q"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="search"
                    placeholder="Search experiences..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <DateTimePicker {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {tagsQuery.data && (
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <MultiSelect
                options={tagsQuery.data.map((tag) => ({
                  value: tag.id.toString(),
                  label: tag.name,
                }))}
                onValueChange={(tags) => {
                  field.onChange(tags.map(Number));
                }}
                defaultValue={field.value?.map((tag) => tag.toString())}
                placeholder="Select tags..."
              />
            )}
          />
        )}

        <Button type="submit">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>
    </Form>
  );
}
