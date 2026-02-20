import {
  Award,
  Building2,
  Calculator,
  Cpu,
  ExternalLink,
  Facebook,
  FileText,
  Factory,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
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
  Youtube,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  'award': Award,
  'building-2': Building2,
  'calculator': Calculator,
  'cpu': Cpu,
  'external-link': ExternalLink,
  'facebook': Facebook,
  'file-text': FileText,
  'factory': Factory,
  'globe': Globe,
  'graduation-cap': GraduationCap,
  'instagram': Instagram,
  'linkedin': Linkedin,
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
  'youtube': Youtube,
};

export const ICON_OPTIONS = Object.entries(ICON_REGISTRY).map(([name, Icon]) => ({ name, Icon }));

export const resolveIcon = (name?: string): LucideIcon => {
  if (name && ICON_REGISTRY[name]) {
    return ICON_REGISTRY[name];
  }
  return ShieldCheck;
};
