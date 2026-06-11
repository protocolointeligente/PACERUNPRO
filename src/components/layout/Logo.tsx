import { useId } from "react";

export function Logo({ className }: { className?: string }) {
  const rawId = useId().replace(/[:]/g, "");
  const gradId = `logo-grad-${rawId}`;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-label="Futebol Coach"
      style={{ filter: "drop-shadow(0 12px 28px var(--accent-soft))" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent2)" />
        </linearGradient>
      </defs>
      <path d="M50 5 87 19v29c0 24-15 39-37 47C28 87 13 72 13 48V19L50 5Z" fill={`url(#${gradId})`} />
      <path d="M28 31h44M28 50h44M28 69h44M39 25v51M61 25v51" stroke="#00131f" strokeWidth="3" opacity=".55" />
      <text x="50" y="59" textAnchor="middle" fontSize="30" fontWeight="1000" fill="#fff" fontFamily="Arial">
        FC
      </text>
    </svg>
  );
}
