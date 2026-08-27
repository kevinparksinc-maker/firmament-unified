import { describe, expect, it } from "vitest";
import { calculateLayerVoteScorecard } from "./layerVoteEngine";

describe("layer-vote-v1 aggregation", () => {
  it("uses the number of eligible layer choices instead of allowing one large raw score to overrule a majority", () => {
    const scorecard = calculateLayerVoteScorecard([
      { layer: "Territory", sideAPoints: 3, sideBPoints: 0 },
      { layer: "Moon", sideAPoints: 2, sideBPoints: 0 },
      { layer: "KP", sideAPoints: 0, sideBPoints: 40 },
    ]);

    expect(scorecard.sideAVotes).toBe(2);
    expect(scorecard.sideBVotes).toBe(1);
    expect(scorecard.sideBWeightedSupport).toBeGreaterThan(scorecard.sideAWeightedSupport);
    expect(scorecard.aggregateChoice).toBe("A");
  });

  it("abstains from an aggregate call when eligible layer votes are tied", () => {
    const scorecard = calculateLayerVoteScorecard([
      { layer: "A choice", sideAPoints: 5, sideBPoints: 1 },
      { layer: "B choice", sideAPoints: 0, sideBPoints: 2 },
      { layer: "Shared", sideAPoints: 0.5, sideBPoints: 0.5 },
    ]);

    expect(scorecard).toMatchObject({
      sideAVotes: 1,
      sideBVotes: 1,
      ties: 1,
      aggregateChoice: "no call",
    });
  });

  it("marks incomplete layer values as abstentions instead of silently selecting a side", () => {
    const scorecard = calculateLayerVoteScorecard([
      { layer: "Incomplete", sideAPoints: Number.NaN, sideBPoints: 2 },
    ]);

    expect(scorecard.votes[0]).toMatchObject({ choice: "abstain", status: "abstain" });
    expect(scorecard.aggregateChoice).toBe("no call");
  });
});
