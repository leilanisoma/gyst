"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogInteractionForm } from "./log-interaction-form";
import { deleteContact } from "@/app/(app)/recruiting/contacts-actions";
import type { ContactWithInteractions } from "./types";

export function ContactCard({ contact }: { contact: ContactWithInteractions }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  const timeline = [...contact.interactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">
              {contact.name}
              {contact.role && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {contact.role}
                </span>
              )}
              {contact.company && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  @ {contact.company.name}
                </span>
              )}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{contact.relationship}</Badge>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="text-primary underline">
                  {contact.email}
                </a>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  LinkedIn
                </a>
              )}
            </div>
            {contact.next_contact_at && (
              <p className="text-muted-foreground mt-1 text-xs">
                Next contact by{" "}
                {new Date(contact.next_contact_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <LogInteractionForm contactId={contact.id} />
            <Button size="sm" variant="ghost" disabled={isPending} onClick={remove}>
              Delete
            </Button>
          </div>
        </div>
        {timeline.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t pt-2">
            {timeline.map((interaction) => (
              <div key={interaction.id} className="text-xs">
                <span className="text-muted-foreground">
                  {new Date(interaction.occurred_at).toLocaleDateString()} ·{" "}
                  {interaction.kind} —
                </span>{" "}
                {interaction.summary}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
