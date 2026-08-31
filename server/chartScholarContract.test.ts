import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Chart Scholar AI contract", () => {
  it("exposes a dedicated chart-aware conversation procedure", () => {
    const procedures = (appRouter as any)._def.procedures;
    expect(procedures["ai.chartScholar"]).toBeDefined();
  });
});
