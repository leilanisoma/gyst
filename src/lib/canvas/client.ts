import { getCanvasEnv } from "@/lib/env";
import type { CanvasHealth, CanvasSelfUser } from "./types";

/** Hand-rolled `fetch` over Canvas's REST API, matching this codebase's existing connector style (Google, job sources) — no SDK dependency. */
async function canvasFetch(path: string): Promise<Response> {
  const env = getCanvasEnv();
  return fetch(new URL(path, env.CANVAS_BASE_URL), {
    headers: { Authorization: `Bearer ${env.CANVAS_PERSONAL_ACCESS_TOKEN}` },
  });
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
