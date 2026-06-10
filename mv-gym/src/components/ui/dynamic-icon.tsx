import {
  Flame,
  Dumbbell,
  BicepsFlexed,
  HeartPulse,
  Leaf,
  Rocket,
  Building2,
  Home,
  Hexagon,
  Activity,
  Footprints,
  CalendarCheck,
  Medal,
  Trophy,
  Ruler,
  TrendingUp,
  Target,
  Sparkles,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  Dumbbell,
  BicepsFlexed,
  HeartPulse,
  Leaf,
  Rocket,
  Building2,
  Home,
  Hexagon,
  Activity,
  Footprints,
  CalendarCheck,
  Medal,
  Trophy,
  Ruler,
  TrendingUp,
  Target,
  Sparkles,
};

export interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon {...props} />;
}
