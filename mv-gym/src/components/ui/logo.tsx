import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mvgymGrad" x1="10" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C6FF00" />
          <stop offset="1" stopColor="#3DDC4A" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="#0A0E14" />
      <path
        d="M18 28 L33 74 L50 38 L67 74 L82 28"
        stroke="url(#mvgymGrad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  className?: string;
}

export function Logo({ size = 40, showTagline = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight">
          mv <span className="gradient-text">gym</span>
        </span>
        {showTagline && (
          <span className="text-xs text-text-muted">sua jornada de performance</span>
        )}
      </div>
    </div>
  );
}
