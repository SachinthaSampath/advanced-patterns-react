import {
  ExperienceFilterParams,
  experienceFiltersSchema,
} from "@advanced-react/shared/schema/experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/features/shared/components/ui/Form";
import Input from "@/features/shared/components/ui/Input";
import { useDebounce } from "@/features/shared/hooks/useDebounce";

type ExperienceFiltersProps = {
  onFiltersChange: (filters: ExperienceFilterParams) => void;
  initialFilters?: ExperienceFilterParams;
};

export default function ExperienceFilters({
  onFiltersChange,
  initialFilters = { q: "" },
}: ExperienceFiltersProps) {
  const form = useForm({
    resolver: zodResolver(experienceFiltersSchema),
    defaultValues: initialFilters,
  });

  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebounce(filters, 300);

  useEffect(() => {
    const { unsubscribe } = form.watch((value) => {
      setFilters({ q: value.q ?? "" });
    });
    return () => unsubscribe();
  }, [form]);

  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  return (
    <Form {...form}>
      <form className="flex gap-4">
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
