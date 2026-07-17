"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createOpportunity } from "@/app/(app)/recruiting/actions";
import {
  ROLE_FAMILIES,
  ROLE_FAMILY_LABELS,
  type RoleFamily,
} from "@/lib/recruiting";

export type OpportunityFormInitialValues = {
  companyName?: string;
  title?: string;
  url?: string;
  location?: string;
};

export function OpportunityForm({
  initialValues,
  defaultOpen = false,
}: {
  initialValues?: OpportunityFormInitialValues;
  defaultOpen?: boolean;
} = {}) {
  const [open, setOpen] = useState(defaultOpen);
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [description, setDescription] = useState("");
  const [roleFamily, setRoleFamily] = useState<RoleFamily>("product_management");
  const [isSwe, setIsSwe] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [established, setEstablished] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [gradYears, setGradYears] = useState("2028");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setCompanyName("");
    setTitle("");
    setLocation("");
    setUrl("");
    setDescription("");
    setRoleFamily("product_management");
    setIsSwe(false);
    setIsFinance(false);
    setEstablished(false);
    setDeadline("");
    setGradYears("2028");
  }

  function save() {
    const eligibleGradYears = gradYears
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value));

    startTransition(async () => {
      const result = await createOpportunity({
        companyName,
        title,
        location: location.trim() || null,
        description: description.trim() || null,
        url: url.trim() || null,
        roleFamily,
        isSwe,
        isFinance,
        eligibleGradYears,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        established,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Opportunity saved.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add opportunity</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add opportunity</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-company">Company</Label>
              <Input
                id="opp-company"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-title">Role title</Label>
              <Input
                id="opp-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product Manager Intern"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-url">Job posting URL (optional)</Label>
            <Input
              id="opp-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-location">Location (optional)</Label>
              <Input
                id="opp-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opp-deadline">Application deadline</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role family</Label>
            <Select
              value={roleFamily}
              onValueChange={(value) => value && setRoleFamily(value as RoleFamily)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_FAMILIES.map((family) => (
                  <SelectItem key={family} value={family}>
                    {ROLE_FAMILY_LABELS[family]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-grad-years">
              Eligible graduation years (comma-separated, optional)
            </Label>
            <Input
              id="opp-grad-years"
              value={gradYears}
              onChange={(event) => setGradYears(event.target.value)}
              placeholder="2027, 2028, 2029"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opp-description">Description (optional)</Label>
            <Textarea
              id="opp-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="group flex items-center gap-2 text-sm">
              <Checkbox checked={isSwe} onCheckedChange={(v) => setIsSwe(v === true)} />
              Pure software engineering role
            </label>
            <label className="group flex items-center gap-2 text-sm">
              <Checkbox
                checked={isFinance}
                onCheckedChange={(v) => setIsFinance(v === true)}
              />
              Pure finance role
            </label>
            <label className="group flex items-center gap-2 text-sm">
              <Checkbox
                checked={established}
                onCheckedChange={(v) => setEstablished(v === true)}
              />
              Established company / return-offer potential
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending || !companyName.trim() || !title.trim()}>
            {isPending ? "Saving…" : "Save opportunity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
