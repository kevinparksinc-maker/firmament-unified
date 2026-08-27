import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

type TysonDouglasHistoricalRecord = {
  protocol: string;
  status: string;
  event: {
    sideA: string;
    sideB: string;
    localDate: string;
    localTime: string;
    timezone: string;
    venue: string;
    latitude: number;
    longitude: number;
    eventInstantBasis: string;
  };
  pregame: {
    favoriteSide: string;
    favorite: string;
    underdogSide: string;
    underdog: string;
    marketContext: string;
  };
  outcomeProvenance: {
    winnerSide: string;
    winner: string;
    method: string;
    rule: string;
  };
  sources: Array<{ label: string; url: string; usedFor: string[] }>;
  evaluationBoundary: string;
};

async function loadRecord(): Promise<TysonDouglasHistoricalRecord> {
  const source = await readFile(
    new URL("../data/historical/tyson-douglas-1990-02-11.json", import.meta.url),
    "utf8",
  );
  return JSON.parse(source) as TysonDouglasHistoricalRecord;
}

describe("Tyson–Douglas frozen stress-test record", () => {
  it("keeps pre-event inputs and observed outcome in declared separate fields", async () => {
    const record = await loadRecord();

    expect(record.protocol).toBe("tyson-douglas-stress-test-v1");
    expect(record.status).toBe("frozen historical calibration record");
    expect(record.event).toMatchObject({
      sideA: "Mike Tyson",
      sideB: "James Buster Douglas",
      localDate: "1990-02-11",
      localTime: "09:00",
      timezone: "Asia/Tokyo",
      venue: "Tokyo Dome",
      latitude: 35.7056,
      longitude: 139.7519,
    });
    expect(record.event.eventInstantBasis).toContain("not represented as an independently verified bell time");

    expect(record.pregame).toMatchObject({
      favoriteSide: "A",
      favorite: "Mike Tyson",
      underdogSide: "B",
      underdog: "James Buster Douglas",
    });
    expect(record.pregame.marketContext).toContain("The Guardian documents Douglas as the 42-to-1 underdog");
    expect(record.pregame.marketContext).toContain("World Boxing Council independently describes Tyson");

    expect(record.outcomeProvenance).toEqual({
      winnerSide: "B",
      winner: "James Buster Douglas",
      method: "tenth-round knockout",
      rule: "This observed result is post-calculation provenance only. It must never be supplied to a calculation procedure.",
    });
    expect(record.evaluationBoundary).toContain("single historical stress test");
  });

  it("retains the Guardian and WBC source roles without claiming a verified bell time", async () => {
    const record = await loadRecord();
    const guardian = record.sources.find((source) => source.label.startsWith("The Guardian"));
    const wbc = record.sources.find((source) => source.label.startsWith("World Boxing Council"));

    expect(guardian?.usedFor).toEqual(
      expect.arrayContaining(["reported 9am ring entry", "Douglas 42-to-1 underdog"]),
    );
    expect(wbc?.usedFor).toEqual(
      expect.arrayContaining(["date", "Tokyo Dome location", "Tyson favorite context", "Douglas tenth-round knockout"]),
    );
    expect(wbc?.usedFor).not.toContain("reported 9am ring entry");
  });
});
