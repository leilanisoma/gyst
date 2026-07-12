export type SuggestionStatus = "proposed" | "accepted" | "dismissed";

export type TimeBlockSuggestion = {
  id: string;
  task_id: string;
  start_at: string;
  end_at: string;
  status: SuggestionStatus;
  explanation: string | null;
  score: number;
  google_event_id: string | null;
  tasks: { title: string; area: string } | null;
};
