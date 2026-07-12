import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "./contact-form";
import { ContactCard } from "./contact-card";
import type { ContactWithInteractions } from "./types";

const CONTACTS_SELECT = `
  id, name, role, relationship, email, linkedin_url,
  last_contacted_at, next_contact_at,
  company:companies(id, name),
  interactions(id, kind, summary, occurred_at, follow_up_at)
`;

export async function ContactsSection() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select(CONTACTS_SELECT)
    .order("created_at", { ascending: false });

  const rows = (contacts ?? []) as unknown as ContactWithInteractions[];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Contacts
            <span className="text-muted-foreground font-normal">
              {" "}
              — networking CRM and timeline
            </span>
          </h2>
          <ContactForm />
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No contacts added yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
