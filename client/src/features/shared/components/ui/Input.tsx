import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function Input({ className, error, ...props }: InputProps) {
  return (
    <input
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
