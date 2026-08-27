import { describe, expect, it } from "vitest";
import {
  formatDeterministicSportsHoraryFallback,
  type SportsHoraryV2Input,
} from "./sportsHoraryV2Reading";

describe("legacy Cluster narration fallback", () => {
  it("preserves the layer-count choice and labels raw totals as audit-only when narration is unavailable", () => {
    const input: SportsHoraryV2Input = {
      question: "Who wins?",
      natalText: "",
      transitText: "",
      favoriteName: "Mike Tyson",
      challengerName: "James Buster Douglas",
    };
    const prediction = {
      breakdown: [],
      layerVoteScorecard: {
        version: "layer-vote-v1",
        votes: [
          { layer: "Territorial Control", sideAPoints: 10, sideBPoints: 0, difference: 10, supportMagnitude: 10, choice: "A", status: "eligible", reason: "A leads." },
          { layer: "KP Stellar", sideAPoints: 0, sideBPoints: 12, difference: -12, supportMagnitude: 12, choice: "B", status: "eligible", reason: "B leads." },
          { layer: "Arabic Lots", sideAPoints: 0, sideBPoints: 0, difference: 0, supportMagnitude: 0, choice: "tie", status: "tie", reason: "Tie." },
        ],
        sideAVotes: 1,
        sideBVotes: 1,
        ties: 1,
        abstentions: 0,
        sideAWeightedSupport: 10,
        sideBWeightedSupport: 12,
        aggregateChoice: "tie",
        aggregateReason: "Eligible layer choices are tied.",
      },
      sideATotal: 89,
      sideBTotal: 10,
      margin: 79,
      predictedWinner: "too close to call",
      confidence: 0,
      volatilityWarning: "",
      regulusOverride: null,
      algolOverride: null,
    } as unknown as ReturnType<typeof import("./masterPredictionEngine").calculateFullPrediction>;

    const output = formatDeterministicSportsHoraryFallback(input, prediction);

    expect(output).toContain("The optional narrative service is unavailable");
    expect(output).toContain("**Result: No decisive Cluster result.** Eligible layer choices are tied.");
    expect(output).toContain("Eligible layer choices: Side A 1; Side B 1; ties 1; abstentions 0.");
    expect(output).toContain("**Side A:** Territorial Control.");
    expect(output).toContain("**Side B:** KP Stellar.");
    expect(output).toContain("Raw point totals remain diagnostics only: Side A 89.00, Side B 10.00, margin 79.00.");
    expect(output).toContain("They do not override the layer-count result.");
  });
});
