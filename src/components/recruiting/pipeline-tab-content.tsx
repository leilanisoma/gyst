"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApplicationsView } from "./applications-view";
import { APPLICATION_STAGE_LABELS, type ApplicationStage } from "@/lib/recruiting";
import type { ApplicationWithOpportunity } from "./types";

/** Stat tiles (dataviz skill: "a handful of headline numbers" is a KPI row, not a chart) + a search box, above the big table/board — the "general overview" made actually big, not squeezed into a narrow accordion row (Phase 9D-4). */
export function PipelineTabContent({
  applications,
  ghostedIds,
}: {
  applications: ApplicationWithOpportunity[];
  ghostedIds: Set<string>;
}) {
  const [query, setQuery] = useState("");

  const stageCounts = new Map<ApplicationStage, number>();
  for (const application of applications) {
    stageCounts.set(application.stage, (stageCounts.get(application.stage) ?? 0) + 1);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? applications.filter((application) => {
        const opportunity = application.opportunity;
        return (
          opportunity?.title.toLowerCase().includes(normalizedQuery) ||
          opportunity?.company?.name.toLowerCase().includes(normalizedQuery)
        );
      })
    : applications;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{applications.length} total</Badge>
        {[...stageCounts.entries()].map(([stage, count]) => (
          <Badge key={stage} variant="secondary">
            {APPLICATION_STAGE_LABELS[stage]}: {count}
          </Badge>
        ))}
        {ghostedIds.size > 0 && (
          <Badge variant="destructive">{ghostedIds.size} ghosted</Badge>
        )}
      </div>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by role or company..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {normalizedQuery && filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No matches for &ldquo;{query}&rdquo;.</p>
      ) : (
        <ApplicationsView applications={filtered} ghostedIds={ghostedIds} />
      )}
    </div>
  );
}
