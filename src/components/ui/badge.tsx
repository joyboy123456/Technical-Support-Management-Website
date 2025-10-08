import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border-0 px-2.5 py-0.5 text-[13px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 ease overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        outline:
          "border border-input text-foreground hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-[#52A67D] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        warning:
          "bg-[#E6A23C] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        inactive:
          "bg-[#9CA3AF] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
