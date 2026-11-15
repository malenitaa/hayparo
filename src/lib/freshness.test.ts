import { describe, expect, it } from "vitest";
import { getDisplayState } from "./freshness";

// 15/11/2026 15:00 en Buenos Aires (UTC-3).
const now = new Date("2026-11-15T18:00:00.000Z");
const haceUnaHora = "2026-11-15T17:00:00.000Z";
const ayer = "2026-11-14T18:00:00.000Z";

describe("getDisplayState", () => {
  it("con un chequeo de hace 1 h muestra el estado normal", () => {
    expect(getDisplayState({ isStrike: false, updatedAt: haceUnaHora }, now)).toBe("calm");
    expect(getDisplayState({ isStrike: true, updatedAt: haceUnaHora }, now)).toBe("strike");
  });

  it("con un chequeo de ayer dice que no hay datos actualizados", () => {
    expect(getDisplayState({ isStrike: false, updatedAt: ayer }, now)).toBe("stale");
    expect(getDisplayState({ isStrike: true, updatedAt: ayer }, now)).toBe("stale");
  });

  it("un chequeo de ayer a la noche no vale hoy aunque sea de hace 1 h", () => {
    // 15/11 00:30 en BA vs. 14/11 23:30 en BA.
    const pasadaLaMedianoche = new Date("2026-11-15T03:30:00.000Z");
    expect(
      getDisplayState({ isStrike: false, updatedAt: "2026-11-15T02:30:00.000Z" }, pasadaLaMedianoche)
    ).toBe("stale");
  });

  it("un chequeo de hoy pero de hace más de 8 h no vale", () => {
    expect(getDisplayState({ isStrike: false, updatedAt: "2026-11-15T09:00:00.000Z" }, now)).toBe("stale");
  });

  it("una corrección manual de hoy vale aunque tenga más de 8 h", () => {
    expect(
      getDisplayState({ isStrike: true, updatedAt: "2026-11-15T09:00:00.000Z", updatedBy: "manual" }, now)
    ).toBe("strike");
  });

  it("una corrección manual de ayer no vale", () => {
    expect(getDisplayState({ isStrike: true, updatedAt: ayer, updatedBy: "manual" }, now)).toBe("stale");
  });

  it("una fecha inválida no vale", () => {
    expect(getDisplayState({ isStrike: false, updatedAt: "no-es-fecha" }, now)).toBe("stale");
  });
});
