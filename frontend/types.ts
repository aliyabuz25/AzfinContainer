
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  isExternal?: boolean;
  children?: NavItem[];
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  content: string;
  benefits?: string[];
  icon: string;
  scopeTitle?: string;
  summaryTitle?: string;
  benefitsTitle?: string;
  durationLabel?: string;
  durationValue?: string;
  standardLabel?: string;
  standardValue?: string;
  consultationTitle?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  category: string;
  status: 'draft' | 'published' | 'upcoming' | 'archived';
}

export interface StatisticItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface TrainingItem {
  id: string;
  title: string;
  description: string;
  fullContent?: string;
  syllabus?: string[];
  startDate: string;
  duration: string;
  level: string;
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  certLabel?: string;
  infoTitle?: string;
  aboutTitle?: string;
  syllabusTitle?: string;
  durationLabel?: string;
  startLabel?: string;
  statusLabel?: string;
  sidebarNote?: string;
  highlightWord?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  logo: string;
}

export interface AuditBenefitItem {
  title: string;
  description: string;
}
