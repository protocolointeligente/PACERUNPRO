"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  colorClassName?: string;
  trackClassName?: string;
  "aria-label"?: string;
}

function Progress({ className, value = 0, colorClassName = "gradient-primary", trackClassName, "aria-label": ariaLabel, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-card-hover", trackClassName, className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
