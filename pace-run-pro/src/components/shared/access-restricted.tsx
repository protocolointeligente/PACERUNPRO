import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CoachRole } from "@/lib/coach-permissions";
import { ROLE_LABELS } from "@/lib/coach-permissions";

interface AccessRestrictedProps {
  feature: string;
  currentRole: CoachRole;
  requiredRoles?: CoachRole[];
}

export function AccessRestricted({ feature, currentRole, requiredRoles }: AccessRestrictedProps) {
  const requiredLabel = requiredRoles
    ?.map((r) => ROLE_LABELS[r])
    .join(" ou ");

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="font-display text-xl font-bold text-text">Acesso restrito</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        O módulo de{" "}
        <span className="font-semibold text-text">{feature}</span> não está
        disponível para{" "}
        <span className="font-semibold text-text">{ROLE_LABELS[currentRole]}</span>.
        {requiredLabel ? (
          <>
            {" "}Disponível para{" "}
            <span className="font-semibold text-text">{requiredLabel}</span>.
          </>
        ) : null}
      </p>
      <div className="mt-5 flex justify-center">
        <Badge variant="warning">{ROLE_LABELS[currentRole]}</Badge>
      </div>
    </div>
  );
}
