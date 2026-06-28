"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { UNIVERSITY_COURSES } from "@/lib/university-data";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const LEVEL_LABEL: Record<string, string> = {
  iniciante: "Iniciante",
  intermediário: "Intermediário",
  avançado: "Avançado",
};

export default function AtletaCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const course = UNIVERSITY_COURSES.find((c) => c.id === courseId);
  if (!course || (course.for !== "athlete" && course.for !== "both")) {
    notFound();
  }

  const [openLesson, setOpenLesson] = useState<string | null>(course.lessons[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/atleta/universidade"
          className="mb-4 flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "rgba(236,234,227,0.5)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos cursos
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: course.color }}>
            {course.category}
          </span>
          <span className="text-[10px]" style={{ color: "rgba(236,234,227,0.35)" }}>
            · {LEVEL_LABEL[course.level]}
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "#ECEAE3" }}>
          {course.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(236,234,227,0.55)" }}>
          {course.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(236,234,227,0.45)" }}>
            <BookOpen className="h-3.5 w-3.5" />
            {course.lessons.length} aulas
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(236,234,227,0.45)" }}>
            <Clock className="h-3.5 w-3.5" />
            {course.totalDuration}
          </span>
          <Badge variant="primary" className="text-[10px]">
            <GraduationCap className="h-3 w-3" />
            PACE University
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {course.lessons.map((lesson, i) => {
          const isOpen = openLesson === lesson.id;
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border overflow-hidden"
              style={{
                background: isOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                borderColor: isOpen
                  ? `${course.color}40`
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <button
                className="flex w-full items-center gap-4 p-4 text-left"
                onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    background: isOpen ? `${course.color}25` : "rgba(255,255,255,0.06)",
                    color: isOpen ? course.color : "rgba(236,234,227,0.5)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isOpen ? "#ECEAE3" : "rgba(236,234,227,0.75)" }}
                  >
                    {lesson.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(236,234,227,0.35)" }}>
                    {lesson.duration}
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0" style={{ color: course.color }} />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "rgba(236,234,227,0.3)" }} />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-5 pt-1 text-sm leading-relaxed prose-custom"
                      style={{ color: "rgba(236,234,227,0.7)" }}
                    >
                      <LessonContent content={lesson.content} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LessonContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-semibold text-base mt-4" style={{ color: "#ECEAE3" }}>
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-sm" style={{ color: "#ECEAE3" }}>
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#C6F24E" }} />
              <InlineMarkdown text={line.slice(2)} />
            </div>
          );
        }
        if (line.trim() === "") return null;
        return <InlineMarkdown key={i} text={line} as="p" />;
      })}
    </div>
  );
}

function InlineMarkdown({ text, as: Tag = "span" }: { text: string; as?: "p" | "span" }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Tag>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ color: "#ECEAE3", fontWeight: 600 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </Tag>
  );
}
