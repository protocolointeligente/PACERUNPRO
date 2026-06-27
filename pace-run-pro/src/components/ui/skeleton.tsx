import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-card-hover", className)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-card-hover h-3", className)} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-card-hover", className)} />;
}
