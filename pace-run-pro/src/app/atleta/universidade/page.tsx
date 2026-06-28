"use client";

import Link from "next/link";
import { GraduationCap, Clock, BookOpen, ChevronRight } from "lucide-react";
import { UNIVERSITY_COURSES } from "@/lib/university-data";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const athleteCourses = UNIVERSITY_COURSES.filter(
  (c) => c.for === "athlete" || c.for === "both"
);

const LEVEL_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediário: "Intermediário",
  avançado: "Avançado",
};

export default function AtletaUniversidadePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(198,242,78,0.12)" }}
          >
            <GraduationCap className="h-5 w-5" style={{ color: "#C6F24E" }} />
          </span>
          <Badge variant="primary">PACE University</Badge>
        </div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "#ECEAE3" }}>
          Aprenda a treinar melhor
        </h1>
        <p className="mt-1.5 max-w-xl text-sm" style={{ color: "rgba(236,234,227,0.55)" }}>
          Cursos criados especialmente para atletas — entenda a ciência por trás dos seus treinos e tire o máximo do PACE RUN PRO.
        </p>
      </motion.div>

      <div className="space-y-4">
        {athleteCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Link href={`/atleta/universidade/${course.id}`}>
              <div
                className="group rounded-2xl border p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold"
                    style={{ background: `${course.color}20`, color: course.color }}
                  >
                    {course.lessons.length}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: course.color }}>
                        {course.category}
                      </span>
                      <span className="text-[10px]" style={{ color: "rgba(236,234,227,0.35)" }}>
                        · {LEVEL_LABEL[course.level]}
                      </span>
                    </div>
                    <p className="font-semibold" style={{ color: "#ECEAE3" }}>{course.title}</p>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(236,234,227,0.55)" }}>
                      {course.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(236,234,227,0.45)" }}>
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.lessons.length} aulas
                      </span>
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(236,234,227,0.45)" }}>
                        <Clock className="h-3.5 w-3.5" />
                        {course.totalDuration}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: "rgba(236,234,227,0.25)" }}
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
