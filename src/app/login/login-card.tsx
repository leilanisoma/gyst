"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendMagicLink, verifyLoginCode } from "./actions";

type Status = "idle" | "sent" | "verifying" | "error";

export function LoginCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  function handleSendCode() {
    startTransition(async () => {
      const result = await sendMagicLink();
      if (result.ok) {
        setStatus("sent");
        setError(null);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  function handleVerifyCode() {
    startTransition(async () => {
      const result = await verifyLoginCode(code);
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  const showCodeInput = status === "sent" || (status === "error" && code !== "");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>gyst</CardTitle>
        <CardDescription>
          A private, single-user space. Sign in with a code sent to your
          inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "sent" && (
          <p className="text-muted-foreground text-sm">
            Check your email for a 6-digit code.
          </p>
        )}
        {status === "error" && (
          <p className="text-destructive text-sm">{error}</p>
        )}
        {showCodeInput && (
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        )}
      </CardContent>
      <CardFooter>
        {showCodeInput ? (
          <Button
            onClick={handleVerifyCode}
            disabled={isPending || code.length === 0}
            className="w-full"
          >
            {isPending ? "Verifying…" : "Verify code"}
          </Button>
        ) : (
          <Button onClick={handleSendCode} disabled={isPending} className="w-full">
            {isPending ? "Sending…" : "Send login code"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
