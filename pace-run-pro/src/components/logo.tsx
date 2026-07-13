interface LogoProps {
  variant?: "mark" | "horizontal";
  size?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", size = 36, className = "" }: LogoProps) {
  const Icon = (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-primary text-background shadow-lg shadow-primary/20"
      style={{ width: size, height: size }}
    >
      <span className="font-display font-black leading-none tracking-normal" style={{ fontSize: size * 0.42 }}>
        PR
      </span>
      <span className="absolute -right-2 top-1 h-1.5 w-8 rotate-[-25deg] rounded-full bg-accent" />
    </span>
  );

  if (variant === "mark") return <span className={className}>{Icon}</span>;

  const textSize = size >= 48 ? "text-xl" : "text-sm";
  const subSize = size >= 48 ? "text-xs" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      <span className="flex flex-col leading-none">
        <span className={`font-display ${textSize} font-extrabold text-text`}>
          PACE<span className="text-primary">RUN</span>
          <span className="ml-1 text-accent">PRO</span>
        </span>
        {size >= 36 && (
          <span className={`${subSize} font-medium uppercase tracking-[0.14em] text-text-muted`}>
            Calendario de performance
          </span>
        )}
      </span>
    </span>
  );
}
