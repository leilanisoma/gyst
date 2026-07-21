"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationBoard } from "./application-board";
import { ApplicationTable } from "./application-table";
import type { ApplicationWithOpportunity } from "./types";

export function ApplicationsView({
  applications,
  ghostedIds,
}: {
  applications: ApplicationWithOpportunity[];
  ghostedIds?: Set<string>;
}) {
  const [view, setView] = useState<"board" | "table">("board");

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No opportunities saved yet. Paste a job posting URL or add one
          manually to start tracking it.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={view === "board" ? "default" : "outline"}
          onClick={() => setView("board")}
        >
          Board
        </Button>
        <Button
          size="sm"
          variant={view === "table" ? "default" : "outline"}
          onClick={() => setView("table")}
        >
          Table
        </Button>
      </div>
      {view === "board" ? (
        <ApplicationBoard applications={applications} />
      ) : (
        <ApplicationTable applications={applications} ghostedIds={ghostedIds} />
      )}
    </div>
  );
}
