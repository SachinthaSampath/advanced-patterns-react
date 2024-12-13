import { Slot } from "@radix-ui/react-slot";
import {
  Link as TanStackLink,
  LinkComponentProps,
} from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof linkVariants> &
  LinkComponentProps & {
    asChild?: boolean;
  };

export default function Link({
  className,
  variant,
  asChild = false,
  ...props
}: LinkProps) {
  const Comp = asChild ? Slot : TanStackLink;
  return (
    <Comp {...props} className={cn(linkVariants({ variant }), className)} />
  );
}

const linkVariants = cva("hover:underline", {
  variants: {
    variant: {
      default: "text-secondary-500 dark:text-primary-500",
      ghost: "hover:no-underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
