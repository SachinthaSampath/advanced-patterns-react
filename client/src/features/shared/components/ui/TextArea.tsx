import { cn } from "@/lib/utils/cn";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export default function TextArea({
  className,
  error,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded border border-neutral-200 p-2 dark:border-neutral-800",
        "focus:border-neutral-400 focus:outline-none dark:focus:border-neutral-600",
        error &&
          "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500",
        className,
      )}
    />
  );
}
