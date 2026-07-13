import { afterEach, describe, expect, it, vi } from "vitest";
import { checkCanvasAccess } from "./client";

function stubCanvasEnv() {
  vi.stubEnv("CANVAS_BASE_URL", "https://canvas.example.edu");
  vi.stubEnv("CANVAS_PERSONAL_ACCESS_TOKEN", "test-token");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("checkCanvasAccess", () => {
  it("reports ok and the authenticated user's name on success", async () => {
    stubCanvasEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: "Ishani Sood" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkCanvasAccess()).resolves.toEqual({
      ok: true,
      message: "Authenticated as Ishani Sood",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/api/v1/users/self", "https://canvas.example.edu"),
      { headers: { Authorization: "Bearer test-token" } },
    );
  });

  it("reports not ok on a 401 (bad/expired token)", async () => {
    stubCanvasEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const health = await checkCanvasAccess();
    expect(health.ok).toBe(false);
    expect(health.message).toContain("401");
  });

  it("reports not ok on a network failure", async () => {
    stubCanvasEnv();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const health = await checkCanvasAccess();
    expect(health).toEqual({ ok: false, message: "fetch failed" });
  });

  it("reports not ok when Canvas env vars are missing", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const health = await checkCanvasAccess();
    expect(health.ok).toBe(false);
  });
});
