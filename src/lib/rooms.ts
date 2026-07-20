/**
 * The three full "rooms" reached by sliding through the filmstrip
 * (`ROOM_SEQUENCE`), not clicked from the hub — single source of truth for
 * the href/label/background each room's `RoomHeader` uses. `background` is
 * the folder under `public/rooms/` holding that room's
 * `{dawn,day,dusk,night}.png` set.
 */
export type RoomDefinition = {
  href: string;
  label: string;
  description: string;
  background: string;
};

export const ROOMS: Record<
  "wellness" | "recruiting" | "school",
  RoomDefinition
> = {
  wellness: {
    href: "/wellness",
    label: "Wellness",
    description: "The garden",
    background: "garden",
  },
  recruiting: {
    href: "/recruiting",
    label: "Recruiting",
    description: "The office",
    background: "studydesk",
  },
  school: {
    href: "/school",
    label: "School",
    description: "The study nook",
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

export const AMBIENT_OBJECTS: Record<
  "gmail" | "inbox" | "settings",
  AmbientObjectDefinition
> = {
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
