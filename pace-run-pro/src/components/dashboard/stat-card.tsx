import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  accent = "primary",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info" | "danger";
  hint?: string;
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    danger: "bg-danger/15 text-danger",
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-2 font-stat text-2xl font-bold text-text">
            {value}
            {unit && <span className="ml-1 text-sm font-medium text-text-muted">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
