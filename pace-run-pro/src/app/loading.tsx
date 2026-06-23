import { Logo } from "@/components/logo";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5">
      <Logo size={40} />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-border">
        <div className="h-full w-full animate-pulse-soft rounded-full bg-gradient-to-r from-primary via-accent to-secondary" />
      </div>
    </div>
  );
}
