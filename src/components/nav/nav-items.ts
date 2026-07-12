import {
  Sun,
  Inbox,
  ListChecks,
  Briefcase,
  GraduationCap,
  HeartPulse,
  MessageCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/recruiting", label: "Recruiting", icon: Briefcase },
  { href: "/school", label: "School", icon: GraduationCap },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];
