/** Minimal shape of Canvas's `GET /api/v1/users/self` response — only the fields this app reads. */
export type CanvasSelfUser = {
  id: number;
  name: string;
};

export type CanvasHealth = {
  ok: boolean;
  message: string;
};

/** `GET /api/v1/courses` with `include[]=term` — only the fields this app reads. */
export type CanvasCourse = {
  id: number;
  name: string;
  course_code: string | null;
  term?: { name: string | null } | null;
};

/** `GET /api/v1/courses/:id/assignments` with `include[]=submission`. */
export type CanvasAssignment = {
  id: number;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  submission_types: string[] | null;
  html_url: string;
  submission?: { submitted_at: string | null; workflow_state: string } | null;
};

/** `GET /api/v1/calendar_events?type=event` — lecture/exam/office-hour entries a course publishes to its calendar. */
export type CanvasCalendarEvent = {
  id: number;
  title: string;
  start_at: string | null;
  end_at: string | null;
  location_name: string | null;
  context_code: string;
  html_url: string;
};
