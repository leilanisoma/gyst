import {
  BookOpen,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Mail,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

/**
 * The four full "rooms" (Phase 9D room map) — single source of truth for
 * the href/label/icon/accent every `RoomDoorway` and matching `RoomHeader`
 * uses. Accents are placeholder chart-token assignments; each room's real
 * color identity is a 9D-2..9D-5 task.
 */
export type RoomDefinition = {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export const ROOMS: Record<
  "wellness" | "gmail" | "recruiting" | "school",
  RoomDefinition
> = {
  wellness: {
    id: "wellness",
    href: "/wellness",
    label: "Wellness",
    description: "The garden",
    icon: HeartPulse,
    accent: "var(--chart-2)",
  },
  gmail: {
    id: "gmail",
    href: "/gmail",
    label: "Gmail",
    description: "The mailbox",
    icon: Mail,
    accent: "var(--chart-3)",
  },
  recruiting: {
    id: "recruiting",
    href: "/recruiting",
    label: "Recruiting",
    description: "The office",
    icon: Briefcase,
    accent: "var(--chart-4)",
  },
  school: {
    id: "school",
    href: "/school",
    label: "School",
    description: "The study nook",
    icon: GraduationCap,
    accent: "var(--chart-1)",
  },
};

/**
 * Small ambient objects in the Living Room scene (Phase 9D room map) —
 * Inbox and Settings no longer get their own doorway, just a bedside
 * journal and a wall thermostat. No `RoomHeader` counterpart: see
 * `AmbientObject` for why.
 */
export type AmbientObjectDefinition = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: string;
};

export const AMBIENT_OBJECTS: Record<
  "inbox" | "settings",
  AmbientObjectDefinition
> = {
  inbox: {
    href: "/inbox",
    label: "Journal",
    icon: BookOpen,
    accent: "var(--chart-5)",
  },
  settings: {
    href: "/settings",
    label: "Thermostat",
    icon: Thermometer,
    accent: "var(--muted-foreground)",
  },
};
