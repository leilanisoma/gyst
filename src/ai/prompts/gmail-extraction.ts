/**
 * Prompt for single-Gmail-message extraction (PLAN.md §15 task 7.4). Kept
 * as a versioned file per CLAUDE.md's "prompts are versioned files under
 * src/ai/prompts/, not inline strings" rule. `messageText` must already be
 * one message's subject/from/body — never a whole thread or mailbox dump
 * (enforced by the caller, src/lib/gmail/extract.ts).
 */
export function buildGmailExtractionPrompt(messageText: string): string {
  return (
    `Extract actionable recruiting/school items from this single email ` +
    `message. Classify each item as "interview" (an interview is being ` +
    `scheduled or confirmed), "confirmation" (an application or ` +
    `submission was received), "deadline" (a due date is stated), ` +
    `"action" (the sender is requesting something from the recipient), or ` +
    `"other". Write only a short excerpt summarizing the relevant part — ` +
    `never quote the full message body. Use an ISO date string ` +
    `(YYYY-MM-DD) for date if one is mentioned, else null. Set ` +
    `requestedAction to a short description of what the recipient needs ` +
    `to do, or null. Assign a confidence score between 0 and 1. If the ` +
    `message has nothing actionable, return an empty items array.\n\n` +
    `Message:\n${messageText}`
  );
}
