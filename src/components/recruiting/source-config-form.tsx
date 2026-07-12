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
import { createSourceConfig } from "@/app/(app)/recruiting/sources-actions";
import type { AdapterId } from "@/lib/job-sources/types";

const ADAPTER_LABELS: Record<AdapterId, string> = {
  greenhouse: "Greenhouse (company board)",
  lever: "Lever (company board)",
  curated_feed: "Curated internship feed",
};

export function SourceConfigForm() {
  const [open, setOpen] = useState(false);
  const [adapterId, setAdapterId] = useState<AdapterId>("greenhouse");
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [categories, setCategories] = useState("Product");
  const [terms, setTerms] = useState("Summer 2027");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setAdapterId("greenhouse");
    setLabel("");
    setSlug("");
    setCompanyName("");
    setFeedUrl("");
    setCategories("Product");
    setTerms("Summer 2027");
  }

  function save() {
    if (!label.trim()) {
      toast.error("Label is required.");
      return;
    }
    if ((adapterId === "greenhouse" || adapterId === "lever") && !slug.trim()) {
      toast.error("Board slug is required.");
      return;
    }

    const config =
      adapterId === "curated_feed"
        ? {
            feedUrl: feedUrl.trim() || undefined,
            categories: categories
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            terms: terms
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
          }
        : { slug: slug.trim(), companyName: companyName.trim() || undefined };

    startTransition(async () => {
      const result = await createSourceConfig({ adapterId, label: label.trim(), config });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Source added.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Add source
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add discovery source</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Adapter</Label>
            <Select
              value={adapterId}
              onValueChange={(value) => value && setAdapterId(value as AdapterId)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ADAPTER_LABELS) as AdapterId[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {ADAPTER_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source-label">Label</Label>
            <Input
              id="source-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={adapterId === "curated_feed" ? "Pitt CSC / Simplify feed" : "Stripe"}
            />
          </div>
          {adapterId === "curated_feed" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="source-feed-url">Feed URL (optional, defaults to the current listings.json)</Label>
                <Input
                  id="source-feed-url"
                  value={feedUrl}
                  onChange={(event) => setFeedUrl(event.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../listings.json"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="source-categories">Categories (comma-separated)</Label>
                <Input
                  id="source-categories"
                  value={categories}
                  onChange={(event) => setCategories(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="source-terms">Terms (comma-separated)</Label>
                <Input
                  id="source-terms"
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="source-slug">Board slug</Label>
                <Input
                  id="source-slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="stripe"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="source-company-name">Company name (optional)</Label>
                <Input
                  id="source-company-name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Stripe"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Adding…" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
