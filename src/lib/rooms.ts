import { Briefcase, GraduationCap, HeartPulse, type LucideIcon } from "lucide-react";

/**
 * The three full "rooms" reached by sliding through the filmstrip
 * (`ROOM_SEQUENCE`), not clicked from the hub — single source of truth for
 * the href/label/icon/accent/background each room's `RoomHeader` uses.
 * `background` is the folder under `public/rooms/` holding that room's
 * `{dawn,day,dusk,night}.png` set. Accents are placeholder chart-token
 * assignments; each room's real color identity is a 9D-2..9D-5 task.
 */
export type RoomDefinition = {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  background: string;
};

export const ROOMS: Record<"wellness" | "recruiting" | "school", RoomDefinition> = {
  wellness: {
    id: "wellness",
    href: "/wellness",
    label: "Wellness",
    description: "The garden",
    icon: HeartPulse,
    accent: "var(--chart-2)",
    background: "garden",
  },
  recruiting: {
    id: "recruiting",
    href: "/recruiting",
    label: "Recruiting",
    description: "The office",
    icon: Briefcase,
    accent: "var(--chart-4)",
    background: "studydesk",
  },
  school: {
    id: "school",
    href: "/school",
    label: "School",
    description: "The study nook",
    icon: GraduationCap,
    accent: "var(--chart-1)",
    background: "nook",
  },
};

/**
 * Small ambient objects in the Living Room scene (Phase 9D room map v2) —
 * Gmail, Inbox, and Settings don't get their own room; each is a small
 * illustrated object (mailbox/journal/thermostat) rendered by
 * `AmbientObject`. `image` points at the isolated object PNG under
 * `public/rooms/objects/`.
 */
export type AmbientObjectDefinition = {
  href: string;
  label: string;
  image: string;
  accent: string;
};

export const AMBIENT_OBJECTS: Record<"gmail" | "inbox" | "settings", AmbientObjectDefinition> = {
  gmail: {
    href: "/gmail",
    label: "Mailbox",
    image: "/rooms/objects/mailbox.png",
    accent: "var(--chart-3)",
  },
  inbox: {
    href: "/inbox",
    label: "Journal",
    image: "/rooms/objects/journal.png",
    accent: "var(--chart-5)",
  },
  settings: {
    href: "/settings",
    label: "Thermostat",
    image: "/rooms/objects/thermostat.png",
    accent: "var(--muted-foreground)",
  },
};
