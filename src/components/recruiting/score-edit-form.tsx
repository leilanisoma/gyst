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
import { updateJobScore } from "@/app/(app)/recruiting/actions";
import type { JobScoreRow } from "./opportunity-list";

export function ScoreEditForm({
  opportunityId,
  score,
}: {
  opportunityId: string;
  score: JobScoreRow;
}) {
  const [open, setOpen] = useState(false);
  const [skillsExperience, setSkillsExperience] = useState(
    String(score.skills_experience_score),
  );
  const [interestIndustry, setInterestIndustry] = useState(
    String(score.interest_industry_score),
  );
  const [userFeedback, setUserFeedback] = useState(
    String(score.user_feedback_score),
  );
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateJobScore(opportunityId, {
        skillsExperience: Number.parseInt(skillsExperience, 10),
        interestIndustry: Number.parseInt(interestIndustry, 10),
        userFeedback: Number.parseInt(userFeedback, 10),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Score updated.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        Edit score
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Score breakdown</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <ReadOnlyRow label="Role family match" value={score.role_family_score} max={25} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="score-skills">Skills/experience match (0-20)</Label>
            <Input
              id="score-skills"
              type="number"
              min={0}
              max={20}
              value={skillsExperience}
              onChange={(event) => setSkillsExperience(event.target.value)}
            />
          </div>
          <ReadOnlyRow label="Eligibility / grad-year fit" value={score.eligibility_score} max={20} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="score-interest">Interest/industry fit (0-10)</Label>
            <Input
              id="score-interest"
              type="number"
              min={0}
              max={10}
              value={interestIndustry}
              onChange={(event) => setInterestIndustry(event.target.value)}
            />
          </div>
          <ReadOnlyRow
            label="Established company / return offer"
            value={score.established_company_score}
            max={10}
          />
          <ReadOnlyRow label="Deadline urgency" value={score.deadline_urgency_score} max={10} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="score-feedback">User feedback/history (0-5)</Label>
            <Input
              id="score-feedback"
              type="number"
              min={0}
              max={5}
              value={userFeedback}
              onChange={(event) => setUserFeedback(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Saving…" : "Save score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span>
        {value}/{max}
      </span>
    </div>
  );
}
