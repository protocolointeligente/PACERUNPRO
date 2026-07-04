import Image from "next/image";
import { Award, Footprints, GraduationCap, HeartPulse, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COACH_NAME = process.env.FOUNDER_DISPLAY_NAME ?? "Ricardo Luiz Pace Júnior";
const COACH_CREDENTIAL = process.env.FOUNDER_CREDENTIAL ?? "";

const credentials = [
  { icon: GraduationCap, label: "Professor universitário" },
  { icon: Award, label: "Personal trainer desde 2006" },
  { icon: HeartPulse, label: "Especialista em fisiologia do exercício" },
  { icon: Footprints, label: "+15 anos dedicados à corrida de rua" },
  ...(COACH_CREDENTIAL ? [{ icon: ShieldCheck, label: `Responsável técnico — ${COACH_CREDENTIAL}` }] : []),
];

export function AboutCoachSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="glass overflow-hidden rounded-3xl border border-border/50 p-8 sm:p-12">
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="h-56 w-44 overflow-hidden rounded-2xl border border-border shadow-lg shadow-primary/20 sm:h-64 sm:w-52">
                <Image
                  src="/brand/ricardo-pace.jpg"
                  alt="Ricardo Luiz Pace Júnior"
                  width={448}
                  height={597}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <Badge variant="primary" className="mt-4">Fundador &amp; treinador-chefe</Badge>
            </div>
            <div>
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                Quem está por trás do{" "}
                <span className="gradient-text">Pace Run Pro</span>
              </h2>
              <p className="mt-2 text-lg font-semibold text-text">{COACH_NAME}</p>
              <p className="mt-4 text-text-muted">
                Mais de 15 anos dedicados à corrida de rua, unindo formação acadêmica e experiência
                prática com centenas de atletas. O Pace Run Pro nasceu da metodologia que Ricardo
                aplica todos os dias com sua assessoria — agora disponível para qualquer treinador
                ou corredor no Brasil.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {credentials.map((c) => (
                  <div key={c.label} className="flex items-center gap-2.5 text-sm text-text">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="h-4 w-4" />
                    </span>
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
