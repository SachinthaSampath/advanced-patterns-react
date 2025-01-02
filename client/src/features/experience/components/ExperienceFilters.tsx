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

  function handleSubmit(values: ExperienceFilterParams) {
    const filters: ExperienceFilterParams = {};

    if (values.q?.trim()) {
      filters.q = values.q.trim();
    }

    if (values.scheduledAt) {
      filters.scheduledAt = values.scheduledAt;
    }

    onFiltersChange(filters);
  }

  return (
    <Form {...form}>
      <form className="flex gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="q"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="search"
                  placeholder="Search experiences..."
                  className="max-w-sm"
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

        <Button type="submit">
          <Search className="h-4 w-4" />
          Filter
        </Button>
      </form>
    </Form>
  );
}
