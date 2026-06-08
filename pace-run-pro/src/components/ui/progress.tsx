"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  colorClassName?: string;
  trackClassName?: string;
}

function Progress({ className, value = 0, colorClassName = "gradient-primary", trackClassName, ...props }: ProgressProps) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-card-hover", trackClassName, className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
