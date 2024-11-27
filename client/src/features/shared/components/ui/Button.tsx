import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export default function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      {...props}
      className={cn(buttonVariants({ variant, size }), className)}
    />
  );
}

const buttonVariants = cva(
  "rounded-md font-semibold disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-500 to-secondary-500 text-neutral-900 hover:bg-gradient-to-r hover:from-primary-500/70 hover:to-secondary-500/70",
        outline:
          "border border-neutral-200 hover:text-neutral-900 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:text-neutral-50 dark:hover:bg-neutral-800",
        link: "bg-transparent hover:opacity-70",
        destructive: "bg-red-500 text-white hover:bg-red-500/70",
        "destructive-link": "text-red-500 hover:text-red-500/70",
      },
      size: {
        default: "h-10 px-4 py-2",
      },
    },
    compoundVariants: [
      {
        variant: ["link", "destructive-link"],
        size: "default",
        class: "p-0 h-auto",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
