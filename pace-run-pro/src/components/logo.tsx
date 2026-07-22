interface LogoProps {
  variant?: "mark" | "horizontal";
  size?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", size = 36, className = "" }: LogoProps) {
  const Icon = (
    <img
      src={variant === "mark" ? "/docs/logo-app-icon.svg" : "/docs/logo-brand.svg"}
      alt=""
      width={variant === "mark" ? size : Math.round(size * (520 / 120))}
      height={size}
      className="object-contain"
      style={{ flexShrink: 0 }}
    />
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
