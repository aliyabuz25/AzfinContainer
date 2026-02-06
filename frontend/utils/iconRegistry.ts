import {
  Award,
  Building2,
  Calculator,
  Cpu,
  FileText,
  Factory,
  GraduationCap,
  Lightbulb,
  Plane,
  Rocket,
  Scale,
  Search,
  SearchCheck,
  ShieldCheck,
  Users,
  Users2,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  'award': Award,
  'building-2': Building2,
  'calculator': Calculator,
  'cpu': Cpu,
  'file-text': FileText,
  'factory': Factory,
  'graduation-cap': GraduationCap,
  'lightbulb': Lightbulb,
  'plane': Plane,
  'rocket': Rocket,
  'scale': Scale,
  'search': Search,
  'search-check': SearchCheck,
  'shield-check': ShieldCheck,
  'users': Users,
  'users-2': Users2,
  'utensils': Utensils,
};

export const ICON_OPTIONS = Object.entries(ICON_REGISTRY).map(([name, Icon]) => ({ name, Icon }));

export const resolveIcon = (name?: string): LucideIcon => {
  if (name && ICON_REGISTRY[name]) {
    return ICON_REGISTRY[name];
  }
  return ShieldCheck;
};
