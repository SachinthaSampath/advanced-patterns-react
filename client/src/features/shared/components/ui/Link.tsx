import { Slot } from "@radix-ui/react-slot";
import {
  Link as TanStackLink,
  LinkComponentProps,
} from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
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
    <Comp
      {...props}
      className={cn(linkVariants({ variant }), className)}
      activeProps={{
        className: "bg-neutral-100 dark:bg-neutral-800",
        ...props.activeProps,
      }}
    />
  );
}

const linkVariants = cva("hover:underline", {
  variants: {
    variant: {
      default: "text-secondary-500 dark:text-primary-500",
      secondary: "",
      ghost: "hover:no-underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
