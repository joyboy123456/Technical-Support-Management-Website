import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/30 flex field-sizing-content min-h-20 w-full rounded-[10px] border bg-white px-4 py-2.5 text-[15px] text-foreground transition-all duration-200 ease outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
