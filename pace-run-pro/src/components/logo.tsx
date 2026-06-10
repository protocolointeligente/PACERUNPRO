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
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d0a1e" />
          <stop offset="100%" stopColor="#050816" />
        </linearGradient>
        <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="1024" height="1024" rx="220" fill="url(#logo-bg)" />
      <circle cx="512" cy="512" r="380" fill="none" stroke="url(#logo-grad)" strokeWidth="6" opacity="0.25" />
      <path
        d="M 605,130 L 388,522 L 498,522 L 270,875 L 638,488 L 528,488 Z"
        fill="url(#logo-grad)"
        filter="url(#logo-glow)"
      />
      <line x1="250" y1="400" x2="340" y2="400" stroke="url(#logo-grad)" strokeWidth="8" strokeLinecap="round" opacity="0.5" />
      <line x1="220" y1="440" x2="340" y2="440" stroke="url(#logo-grad)" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
      <circle cx="452" cy="526" r="18" fill="white" opacity="0.9" filter="url(#logo-glow)" />
    </svg>
  );

  if (variant === "mark") return <span className={className}>{Icon}</span>;

  const textSize = size >= 48 ? "text-xl" : "text-sm";
  const subSize = size >= 48 ? "text-xs" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      <span className="flex flex-col leading-none">
        <span
          className={`font-display ${textSize} font-extrabold tracking-wide`}
          style={{
            background: "linear-gradient(90deg,#ffffff 0%,#ffffff 65%,#8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          PACE RUN <span style={{ background: "linear-gradient(90deg,#8b5cf6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>PRO</span>
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
