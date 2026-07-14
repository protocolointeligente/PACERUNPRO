interface LogoProps {
  variant?: "mark" | "horizontal";
  size?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", size = 36, className = "" }: LogoProps) {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="PACERUNPRO"
      style={{ flexShrink: 0 }}
    >
      <rect x="13" y="12" width="9" height="40" rx="4" fill="var(--text)" />
      <path
        d="M21 12 H31 A13 13 0 0 1 31 38 H21"
        stroke="var(--text)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="44" y="17" width="14" height="4" rx="2" fill="var(--primary)" />
      <rect x="42" y="25" width="16" height="4" rx="2" fill="var(--primary)" />
      <rect x="44" y="33" width="14" height="4" rx="2" fill="var(--primary)" />
    </svg>
  );

  if (variant === "mark") return <span className={className}>{Icon}</span>;

  const textSize = size >= 48 ? "text-xl" : "text-sm";
  const subSize = size >= 48 ? "text-xs" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      <span className="flex flex-col leading-none">
        <span className={`font-display ${textSize} font-extrabold tracking-[0.06em] text-text`}>
          PACERUN<span style={{ color: "var(--primary)" }}>PRO</span>
        </span>
        {size >= 36 && (
          <span className={`${subSize} mt-1 font-medium uppercase tracking-[0.18em] text-text-muted`}>
            Sistema de performance
          </span>
        )}
      </span>
    </span>
  );
}
