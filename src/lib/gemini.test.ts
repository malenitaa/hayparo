import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyStrike } from "./gemini";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("classifyStrike", () => {
  it("manda la clave en el header x-goog-api-key y no en la URL", async () => {
    vi.stubEnv("GEMINI_API_KEY", "clave-de-test");
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        candidates: [{ content: { parts: [{ text: '{"isStrike":false}' }] } }],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await classifyStrike([{ title: "t", pubDate: "", source: "" }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("clave-de-test");
    expect(init.headers["x-goog-api-key"]).toBe("clave-de-test");
  });
});
