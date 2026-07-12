"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createContact } from "@/app/(app)/recruiting/contacts-actions";
import { CONTACT_RELATIONSHIPS, type ContactRelationship } from "@/lib/recruiting";

export function ContactForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [relationship, setRelationship] = useState<ContactRelationship>("other");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setRole("");
    setCompanyName("");
    setRelationship("other");
    setEmail("");
    setLinkedinUrl("");
  }

  function save() {
    startTransition(async () => {
      const result = await createContact({
        name,
        role: role.trim() || null,
        companyName: companyName.trim() || null,
        relationship,
        email: email.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Contact added.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Add contact
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-role">Role (optional)</Label>
              <Input
                id="contact-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact-company">Company (optional)</Label>
            <Input
              id="contact-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Relationship</Label>
            <Select
              value={relationship}
              onValueChange={(value) =>
                value && setRelationship(value as ContactRelationship)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_RELATIONSHIPS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-email">Email (optional)</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-linkedin">LinkedIn (optional)</Label>
              <Input
                id="contact-linkedin"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !name.trim()}>
            {isPending ? "Saving…" : "Add contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
