export type ProtocolMethodId = "cluster" | "frawley" | "tajika-prasna" | "panchanga" | "god-agent";
export type ProtocolOutcome = "side-a" | "side-b" | "no-call";
export type ProtocolOrientation = "standard" | "inverse-180" | "event-instant";

export type ProtocolEventKey = {
  eventUtcIso: string;
  venueName: string;
  favoriteName: string;
  challengerName: string;
};

export type ProtocolLedgerRun = {
  method: ProtocolMethodId;
  label: string;
  version: string;
  orientation: ProtocolOrientation;
  outcome: ProtocolOutcome;
  comparable: boolean;
  exclusionReason?: string;
  event?: ProtocolEventKey;
};

export type CrossMethodConclusionState =
  | "awaiting-comparable-runs"
  | "event-record-mismatch"
  | "single-directional-method"
  | "side-a-convergence"
  | "side-b-convergence"
  | "cross-method-conflict"
  | "no-directional-convergence";

export type CrossMethodConclusion = {
  state: CrossMethodConclusionState;
  reason: string;
  strictStandardRuns: ProtocolLedgerRun[];
  directionalRuns: ProtocolLedgerRun[];
  excludedRuns: ProtocolLedgerRun[];
};

const normalized = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export function eventKeyFrom(result: {
  eventUtcIso: string;
  venueName: string;
  favoriteName: string;
  challengerName: string;
}): ProtocolEventKey {
  return {
    eventUtcIso: result.eventUtcIso,
    venueName: result.venueName,
    favoriteName: result.favoriteName,
    challengerName: result.challengerName,
  };
}

export function sameProtocolEvent(first: ProtocolEventKey, second: ProtocolEventKey): boolean {
  return normalized(first.eventUtcIso) === normalized(second.eventUtcIso)
    && normalized(first.venueName) === normalized(second.venueName)
    && normalized(first.favoriteName) === normalized(second.favoriteName)
    && normalized(first.challengerName) === normalized(second.challengerName);
}

export function evaluateSportsProtocolLedger(runs: readonly ProtocolLedgerRun[]): CrossMethodConclusion {
  const strictStandardRuns = runs.filter(run => run.comparable && run.event && run.orientation !== "inverse-180");
  const excludedRuns = runs.filter(run => !strictStandardRuns.includes(run));
  const empty = (state: CrossMethodConclusionState, reason: string): CrossMethodConclusion => ({
    state,
    reason,
    strictStandardRuns,
    directionalRuns: [],
    excludedRuns,
  });

  if (strictStandardRuns.length === 0) {
    return empty("awaiting-comparable-runs", "No strict standard-orientation protocol result is available. Manual Cluster input and inverse audits remain visible but cannot form a cross-method conclusion.");
  }

  const referenceEvent = strictStandardRuns[0]!.event!;
  if (strictStandardRuns.some(run => !sameProtocolEvent(referenceEvent, run.event!))) {
    return empty("event-record-mismatch", "No cross-method conclusion: retained strict method results do not share the same UTC instant, venue, Favorite, and Challenger event record.");
  }

  const directionalRuns = strictStandardRuns.filter(run => run.outcome !== "no-call");
  if (strictStandardRuns.length < 2) {
    return {
      ...empty("awaiting-comparable-runs", "One strict event protocol is recorded. Run another method with this exact event record before assessing cross-method convergence."),
      directionalRuns,
    };
  }

  if (directionalRuns.length === 0) {
    return {
      ...empty("no-directional-convergence", "Strict matched methods abstained or tied. No cross-method directional conclusion is available."),
      directionalRuns,
    };
  }

  if (directionalRuns.length === 1) {
    return {
      ...empty("single-directional-method", "Only one strict matched method is directional; this is not cross-method convergence."),
      directionalRuns,
    };
  }

  const firstOutcome = directionalRuns[0]!.outcome;
  if (directionalRuns.some(run => run.outcome !== firstOutcome)) {
    return {
      ...empty("cross-method-conflict", "Strict matched methods point to different sides. No cross-method conclusion is available."),
      directionalRuns,
    };
  }

  const side = firstOutcome === "side-a" ? "side-a-convergence" : "side-b-convergence";
  const sideName = firstOutcome === "side-a" ? "Side A / recorded Favorite" : "Side B / recorded Challenger";
  return {
    ...empty(side, `Strict matched methods converge toward ${sideName}. This is an experimental protocol summary, not a pooled score, probability, or wagering recommendation.`),
    directionalRuns,
  };
}
