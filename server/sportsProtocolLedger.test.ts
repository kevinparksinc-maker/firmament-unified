import { describe, expect, it } from "vitest";
import {
  evaluateSportsProtocolLedger,
  type ProtocolLedgerRun,
} from "../client/src/lib/sportsProtocolLedger";

const event = {
  eventUtcIso: "2026-06-27T23:10:00.000Z",
  venueName: "Target Field",
  favoriteName: "Minnesota Twins",
  challengerName: "Colorado Rockies",
};

function run(overrides: Partial<ProtocolLedgerRun> = {}): ProtocolLedgerRun {
  return {
    method: "frawley",
    label: "Frawley Event",
    version: "frawley-event-v1",
    orientation: "standard",
    outcome: "side-a",
    comparable: true,
    event,
    ...overrides,
  };
}

describe("Sports Horary protocol ledger", () => {
  it("reports Side A convergence only for two strict matched directional methods", () => {
    const result = evaluateSportsProtocolLedger([
      run(),
      run({ method: "tajika-prasna", label: "Tajika / Prasna", version: "tajika-prasna-v1" }),
    ]);

    expect(result.state).toBe("side-a-convergence");
    expect(result.directionalRuns).toHaveLength(2);
  });

  it("preserves a no-call rather than interpreting it as an underdog selection", () => {
    const result = evaluateSportsProtocolLedger([
      run({ outcome: "no-call" }),
      run({ method: "god-agent", label: "God ↔ Agent Flow", version: "god-agent-family-flow-v1", outcome: "no-call" }),
    ]);

    expect(result.state).toBe("no-directional-convergence");
    expect(result.directionalRuns).toHaveLength(0);
  });

  it("reports a conflict when strict matched methods select opposite sides", () => {
    const result = evaluateSportsProtocolLedger([
      run(),
      run({ method: "panchanga", label: "Panchanga / Archetype", version: "panchanga-archetype-v1", orientation: "event-instant", outcome: "side-b" }),
    ]);

    expect(result.state).toBe("cross-method-conflict");
  });

  it("rejects mismatched records and excludes manual Cluster and inverse records", () => {
    const result = evaluateSportsProtocolLedger([
      run(),
      run({
        method: "tajika-prasna",
        label: "Tajika / Prasna",
        version: "tajika-prasna-v1",
        event: { ...event, venueName: "Different Stadium" },
      }),
      run({
        method: "cluster",
        label: "Cluster / Layer Vote",
        version: "layer-vote-v1",
        comparable: false,
        event: undefined,
        exclusionReason: "Manual-chart Cluster result is not a strict event record.",
      }),
      run({
        method: "god-agent",
        label: "God ↔ Agent Flow inverse audit",
        version: "god-agent-family-flow-v1",
        orientation: "inverse-180",
      }),
    ]);

    expect(result.state).toBe("event-record-mismatch");
    expect(result.excludedRuns).toHaveLength(2);
  });
});
