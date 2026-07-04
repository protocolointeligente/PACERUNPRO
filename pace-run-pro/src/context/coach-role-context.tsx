"use client";

import { createContext, useContext, useState } from "react";
import type { CoachRole } from "@/lib/coach-permissions";

interface CoachRoleContextValue {
  role: CoachRole;
  setRole: (role: CoachRole) => void;
  planId: string;
  setPlanId: (planId: string) => void;
}

const CoachRoleContext = createContext<CoachRoleContextValue>({
  role: "owner",
  setRole: () => {},
  planId: "b2b-free",
  setPlanId: () => {},
});

export function CoachRoleProvider({
  children,
  initialRole = "owner",
  initialPlanId = "b2b-free",
}: {
  children: React.ReactNode;
  initialRole?: CoachRole;
  initialPlanId?: string;
}) {
  const [role, setRole] = useState<CoachRole>(initialRole);
  const [planId, setPlanId] = useState(initialPlanId);
  return (
    <CoachRoleContext.Provider value={{ role, setRole, planId, setPlanId }}>
      {children}
    </CoachRoleContext.Provider>
  );
}

export function useCoachRole() {
  return useContext(CoachRoleContext);
}
