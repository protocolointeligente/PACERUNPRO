import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel = "Ver tudo",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary transition-colors hover:text-secondary"
        >
          {hrefLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
