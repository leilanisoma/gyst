"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RoomSideTabDef = {
  id: string;
  label: string;
  content: ReactNode;
  /** Tailwind width class for this tab's expanded pane. Defaults to a standard side-panel width. */
  width?: string;
};

/**
 * Replaces the old "More" panel + `<details>` accordion (Phase 9D-2/9D-4)
 * with a persistent narrow tab rail docked at the right edge; clicking a
 * tab grows its content pane leftward (room for a much wider one, e.g.
 * Recruiting's Pipeline table), clicking anywhere outside collapses it.
 * Desktop only — mobile has no room for a rail + a wide flyout, so callers
 * should render a `md:hidden` fallback (plain stacked sections) alongside
 * this (`hidden md:flex`).
 */
export function RoomSideTabs({ tabs }: { tabs: RoomSideTabDef[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      // Base UI (Select, Dialog, Popover, ...) portals its open popup content
      // straight to <body>, tagged with this attribute regardless of which
      // component rendered it — outside `containerRef` in the DOM even
      // though it's visually part of this panel (e.g. the stage dropdown's
      // options). Without this check, picking a stage closed the whole tab.
      const insidePortal =
        target instanceof Element && target.closest("[data-base-ui-portal]");
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !insidePortal
      ) {
        setActiveId(null);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeId]);

  const active = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <div ref={containerRef} className="flex items-stretch">
      <div
        className={cn(
          "room-glass overflow-hidden rounded-3xl transition-[width] duration-300 ease-out",
          active ? (active.width ?? "w-[400px]") : "w-0",
        )}
      >
        {active && (
          <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto p-6">
            <h2 className="font-heading text-base font-semibold">{active.label}</h2>
            {active.content}
          </div>
        )}
      </div>

      <div className="room-glass ml-2 flex flex-col gap-1 self-center rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveId((current) => (current === tab.id ? null : tab.id))
            }
            className={cn(
              "rounded-xl px-2.5 py-2 text-left text-xs font-medium whitespace-nowrap transition-colors",
              activeId === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-foreground/10",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
