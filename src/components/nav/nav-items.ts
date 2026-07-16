import {
  Sun,
  Inbox,
  ListChecks,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Mail,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Chat (/chat, /chat/memory) is intentionally not a tab here — it's reached
// via the floating chat button (src/components/chat/floating-chat.tsx),
// available from every page instead of being one destination among many.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/recruiting", label: "Recruiting", icon: Briefcase },
  { href: "/school", label: "School", icon: GraduationCap },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/settings", label: "Settings", icon: Settings },
];
