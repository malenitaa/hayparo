import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", () => ({ classifyStrike: vi.fn() }));
vi.mock("@/lib/google-news", () => ({
  fetchCandidateHeadlines: vi.fn(),
  filterRecentRelevant: vi.fn(),
}));
vi.mock("@/lib/strike-status", () => ({
  getStrikeStatus: vi.fn(),
  setStrikeStatus: vi.fn(),
}));

import { classifyStrike } from "@/lib/gemini";
import { fetchCandidateHeadlines, filterRecentRelevant } from "@/lib/google-news";
import { getStrikeStatus, setStrikeStatus } from "@/lib/strike-status";
import { GET } from "./route";

const SECRET = "secreto-de-test";
const candidate = { title: "Paro de colectivos hoy", pubDate: "", source: "Diario" };

function request() {
  return new Request("http://localhost/api/cron/check-strike", {
    headers: { authorization: `Bearer ${SECRET}` },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.CRON_SECRET = SECRET;
  // Estado guardado viejo: no se salta el chequeo por "calma reciente".
  vi.mocked(getStrikeStatus).mockResolvedValue({
    ok: true,
    isStrike: false,
    message: "",
    affectedLines: "",
    updatedBy: "cron",
    detectedFrom: "",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  vi.mocked(fetchCandidateHeadlines).mockResolvedValue([candidate]);
  vi.mocked(filterRecentRelevant).mockReturnValue([candidate]);
});

describe("GET /api/cron/check-strike", () => {
  it("si Gemini falla, devuelve 5xx y no pisa el estado guardado", async () => {
    vi.mocked(classifyStrike).mockRejectedValue(new Error("Gemini respondió con estado 404"));

    const res = await GET(request());

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(await res.json()).toMatchObject({
      ok: false,
      step: "gemini",
      detail: "Gemini respondió con estado 404",
    });
    expect(setStrikeStatus).not.toHaveBeenCalled();
  });

  it("si Google News falla, devuelve 5xx y no pisa el estado guardado", async () => {
    vi.mocked(fetchCandidateHeadlines).mockRejectedValue(new Error("fetch failed"));

    const res = await GET(request());

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(await res.json()).toMatchObject({ ok: false, step: "fetch-news" });
    expect(setStrikeStatus).not.toHaveBeenCalled();
  });

  it("si Gemini clasifica bien, guarda el resultado y devuelve 200", async () => {
    vi.mocked(classifyStrike).mockResolvedValue({
      isStrike: true,
      message: "Paro de colectivos",
      affectedLines: "Colectivos: todas las líneas",
      sourceHeadline: candidate.title,
    });

    const res = await GET(request());

    expect(res.status).toBe(200);
    expect(setStrikeStatus).toHaveBeenCalledWith(
      true,
      "Paro de colectivos",
      "Colectivos: todas las líneas",
      "cron",
      candidate.title
    );
  });

  it("sin el secreto, devuelve 401", async () => {
    const res = await GET(new Request("http://localhost/api/cron/check-strike"));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/cron/check-strike con corrección manual", () => {
  it("una corrección manual de hoy no la pisa el cron aunque Gemini diga paro", async () => {
    vi.mocked(getStrikeStatus).mockResolvedValue({
      ok: true,
      isStrike: false,
      message: "",
      affectedLines: "",
      updatedBy: "manual",
      detectedFrom: "",
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(classifyStrike).mockResolvedValue({
      isStrike: true,
      message: "Paro de colectivos",
      affectedLines: "",
      sourceHeadline: candidate.title,
    });

    const res = await GET(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, skipped: true, reason: "manual-override" });
    expect(setStrikeStatus).not.toHaveBeenCalled();
  });

  it("una corrección manual de otro día ya no manda: el cron vuelve a decidir", async () => {
    vi.mocked(getStrikeStatus).mockResolvedValue({
      ok: true,
      isStrike: true,
      message: "Paro viejo",
      affectedLines: "",
      updatedBy: "manual",
      detectedFrom: "",
      updatedAt: "2026-01-01T12:00:00.000Z",
    });
    vi.mocked(classifyStrike).mockResolvedValue({
      isStrike: false,
      message: "",
      affectedLines: "",
      sourceHeadline: "",
    });

    const res = await GET(request());

    expect(res.status).toBe(200);
    expect(setStrikeStatus).toHaveBeenCalledWith(false, "", "", "cron", "");
  });
});
