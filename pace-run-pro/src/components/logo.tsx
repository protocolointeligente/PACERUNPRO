interface LogoProps {
  /** "mark" = só ícone quadrado | "horizontal" = ícone + wordmark (padrão) */
  variant?: "mark" | "horizontal";
  /** Altura do ícone em px (default: 36) */
  size?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", size = 36, className = "" }: LogoProps) {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#140b28" />
          <stop offset="100%" stopColor="#06030f" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="220" fill="url(#logo-bg)" />
      <g fill="none" stroke="url(#logo-grad)" strokeLinecap="round">
        <path d="M 565,135 A 280,280 0 0 1 845,415" strokeWidth="10" opacity="0.55" />
        <path d="M 565,75  A 340,340 0 0 1 905,415" strokeWidth="8" opacity="0.35" />
        <path d="M 565,15  A 400,400 0 0 1 965,415" strokeWidth="6" opacity="0.2" />
      </g>
      <rect x="300" y="185" width="160" height="665" rx="50" fill="url(#logo-grad)" />
      <circle cx="565" cy="380" r="235" fill="url(#logo-grad)" />
      <circle cx="602" cy="380" r="128" fill="url(#logo-bg)" />
      <g transform="translate(485,255) scale(1.2)" fill="#f8fafc">
        <circle cx="128" cy="20" r="17" />
        <rect x="-16" y="-37" width="32" height="74" rx="16" transform="translate(108,62) rotate(-18)" />
        <rect x="-9" y="-29" width="18" height="58" rx="9" transform="translate(86,58) rotate(35)" />
        <rect x="-9" y="-28" width="18" height="56" rx="9" transform="translate(132,90) rotate(-55)" />
        <rect x="-13" y="-34" width="26" height="68" rx="13" transform="translate(140,118) rotate(-70)" />
        <rect x="-10" y="-28" width="20" height="56" rx="10" transform="translate(172,148) rotate(20)" />
        <rect x="-13" y="-43" width="26" height="86" rx="13" transform="translate(76,128) rotate(48)" />
      </g>
    </svg>
  );

  if (variant === "mark") return <span className={className}>{Icon}</span>;

  const textSize = size >= 48 ? "text-xl" : "text-sm";
  const subSize = size >= 48 ? "text-xs" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      <span className="flex flex-col leading-none">
        <span className={`font-display ${textSize} font-extrabold tracking-wide text-white`}>
          PACE RUN{" "}
          <span
            style={{
              background: "linear-gradient(90deg,#a78bfa,#c4b5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            PRO
          </span>
        </span>
        {size >= 36 && (
          <span className={`${subSize} uppercase tracking-[0.18em] text-[#6b7280] font-medium`}>
            Para quem vive a corrida
          </span>
        )}
      </span>
    </span>
  );
}
