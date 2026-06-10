import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        ref={ref}
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
          selected
            ? "border-primary bg-primary/15 text-primary"
            : "border-border bg-card text-text-muted hover:bg-card-hover hover:text-text",
          className,
        )}
        {...props}
      />
    );
  },
);
Chip.displayName = "Chip";

export { Chip };
