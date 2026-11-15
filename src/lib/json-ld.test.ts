import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  const hostil = { text: "SÍ hay paro — </script><script>alert(1)</script>" };

  it("no deja un </script> que cierre el bloque", () => {
    const out = serializeJsonLd(hostil);
    expect(out).not.toContain("</script");
    expect(out).toContain("\\u003c/script");
  });

  it("sigue siendo el mismo JSON al parsearlo", () => {
    expect(JSON.parse(serializeJsonLd(hostil))).toEqual(hostil);
  });
});
