"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./export-modal";

interface WorkoutActionsProps {
  workoutId: string;
  sport: string;
}

export function WorkoutActions({ workoutId, sport }: WorkoutActionsProps) {
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <div className="sticky bottom-20 z-10 flex justify-center gap-3 lg:bottom-6">
        <Link href={`/atleta/treino/${workoutId}/executar`} className="flex-1 sm:flex-none">
          <Button
            size="lg"
            variant="outline"
            className="w-full px-8 sm:w-auto"
            aria-label="Iniciar treino livre"
          >
            <PlayCircle className="h-5 w-5" />
            Livre
          </Button>
        </Link>

        <Link href={`/atleta/treino/${workoutId}/player`} className="flex-1 sm:flex-none">
          <Button
            size="lg"
            className="w-full px-8 shadow-2xl shadow-primary/40 sm:w-auto"
            aria-label="Iniciar Player Estruturado"
          >
            <PlayCircle className="h-5 w-5" />
            Player
          </Button>
        </Link>

        <Button
          size="lg"
          variant="outline"
          onClick={() => setShowExport(true)}
          aria-label="Exportar treino"
          className="px-4"
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {showExport && (
        <ExportModal
          workoutId={workoutId}
          sport={sport}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
}
