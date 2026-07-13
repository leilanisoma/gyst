import { getCanvasEnv } from "@/lib/env";
import type {
  CanvasAssignment,
  CanvasCalendarEvent,
  CanvasCourse,
  CanvasHealth,
  CanvasSelfUser,
} from "./types";

/** Hand-rolled `fetch` over Canvas's REST API, matching this codebase's existing connector style (Google, job sources) — no SDK dependency. */
async function canvasFetch(path: string): Promise<Response> {
  const env = getCanvasEnv();
  return fetch(new URL(path, env.CANVAS_BASE_URL), {
    headers: { Authorization: `Bearer ${env.CANVAS_PERSONAL_ACCESS_TOKEN}` },
  });
}

async function canvasFetchJson<T>(path: string): Promise<T> {
  const res = await canvasFetch(path);
  if (!res.ok) {
    throw new Error(`Canvas request to ${path} returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Confirms the configured personal access token actually authenticates against this Canvas instance (PLAN.md §15 task 6.1). */
export async function checkCanvasAccess(): Promise<CanvasHealth> {
  try {
    const res = await canvasFetch("/api/v1/users/self");
    if (!res.ok) {
      return { ok: false, message: `Canvas returned ${res.status}` };
    }
    const user = (await res.json()) as CanvasSelfUser;
    return { ok: true, message: `Authenticated as ${user.name}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Active courses for the token's account, with term info. */
export async function listCourses(): Promise<CanvasCourse[]> {
  return canvasFetchJson<CanvasCourse[]>(
    "/api/v1/courses?enrollment_state=active&per_page=100&include[]=term",
  );
}

/** Assignments for one course, including this user's submission state. */
export async function listAssignments(courseId: number): Promise<CanvasAssignment[]> {
  return canvasFetchJson<CanvasAssignment[]>(
    `/api/v1/courses/${courseId}/assignments?per_page=100&include[]=submission`,
  );
}

/** Calendar entries (lectures, exams, office hours) a course has published, within one date window. */
export async function listCalendarEvents(
  courseIds: number[],
  startDate: string,
  endDate: string,
): Promise<CanvasCalendarEvent[]> {
  if (courseIds.length === 0) return [];
  const contextParams = courseIds.map((id) => `context_codes[]=course_${id}`).join("&");
  return canvasFetchJson<CanvasCalendarEvent[]>(
    `/api/v1/calendar_events?type=event&per_page=100&start_date=${startDate}&end_date=${endDate}&${contextParams}`,
  );
}
