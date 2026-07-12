"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendMagicLink } from "./actions";

export function LoginCard() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleSendLink() {
    startTransition(async () => {
      const result = await sendMagicLink();
      if (result.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>gyst</CardTitle>
        <CardDescription>
          A private, single-user space. Sign in with a magic link sent to your
          inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "sent" && (
          <p className="text-muted-foreground text-sm">
            Check your email for a sign-in link.
          </p>
        )}
        {status === "error" && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSendLink}
          disabled={isPending || status === "sent"}
          className="w-full"
        >
          {isPending ? "Sending…" : "Send magic link"}
        </Button>
      </CardFooter>
    </Card>
  );
}
