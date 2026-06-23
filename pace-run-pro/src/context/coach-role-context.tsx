"use client";

import { createContext, useContext, useState } from "react";
import type { CoachRole } from "@/lib/coach-permissions";

interface CoachRoleContextValue {
  role: CoachRole;
  setRole: (role: CoachRole) => void;
}

const CoachRoleContext = createContext<CoachRoleContextValue>({
  role: "owner",
  setRole: () => {},
});

export function CoachRoleProvider({
  children,
  initialRole = "owner",
}: {
  children: React.ReactNode;
  initialRole?: CoachRole;
}) {
  const [role, setRole] = useState<CoachRole>(initialRole);
  return (
    <CoachRoleContext.Provider value={{ role, setRole }}>
      {children}
    </CoachRoleContext.Provider>
  );
}

export function useCoachRole() {
  return useContext(CoachRoleContext);
}
