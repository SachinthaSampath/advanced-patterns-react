import { FieldValues, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils/cn";

type FormFieldProps<T extends FieldValues> = {
  name: keyof T;
  label?: string;
  className?: string;
  children: (props: { error: boolean; name: keyof T }) => React.ReactNode;
};

export default function FormField<T extends FieldValues>({
  name,
  label,
  className,
  children,
}: FormFieldProps<T>) {
  const {
    formState: { errors },
  } = useFormContext<T>();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      {children({ error: !!error, name })}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
