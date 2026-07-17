"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { captureInboxItem } from "@/app/(app)/inbox/actions";

export function CaptureForm() {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const value = text;
    if (!value.trim() || isPending) return;

    startTransition(async () => {
      const result = await captureInboxItem(value);
      if (result.ok) {
        setText("");
        textareaRef.current?.focus();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <div className="origin-top transition-transform duration-[var(--motion-duration-base)] ease-[var(--motion-ease-out)] focus-within:scale-[1.01]">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Dump a thought — a task, a worry, an idea. Sort it out later."
          rows={2}
          autoFocus
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">⌘/Ctrl + Enter to save</p>
        <Button type="submit" size="sm" disabled={!text.trim() || isPending}>
          {isPending ? "Saving…" : "Capture"}
        </Button>
      </div>
    </form>
  );
}
