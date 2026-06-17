import Image from "next/image";

interface LogoProps {
  /** "mark" = só ícone quadrado | "horizontal" = ícone + wordmark (padrão) */
  variant?: "mark" | "horizontal";
  /** Altura do ícone em px (default: 36) */
  size?: number;
  className?: string;
}

export function Logo({ variant = "horizontal", size = 36, className = "" }: LogoProps) {
  const Icon = (
    <Image
      src="/icons/logo-mark.png"
      alt="Pace Run Pro"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
      priority
    />
  );

  if (variant === "mark") return <span className={className}>{Icon}</span>;

  const textSize = size >= 48 ? "text-xl" : "text-sm";
  const subSize = size >= 48 ? "text-xs" : "text-[10px]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      <span className="flex flex-col leading-none">
        <span className={`font-display ${textSize} font-extrabold tracking-wide text-text`}>
          PACE RUN{" "}
          <span style={{ color: "#F05020" }}>PRO</span>
        </span>
        {size >= 36 && (
          <span className={`${subSize} uppercase tracking-[0.18em] font-medium`} style={{ color: "#888888" }}>
            Para quem vive a corrida
          </span>
        )}
      </span>
    </span>
  );
}
