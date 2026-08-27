export type SportsLayerChoice = "A" | "B" | "tie" | "abstain";
export type SportsLayerVoteStatus = "eligible" | "tie" | "abstain";

export interface LayerPointInput {
  layer: string;
  sideAPoints: number;
  sideBPoints: number;
}

export interface SportsLayerVote {
  layer: string;
  sideAPoints: number;
  sideBPoints: number;
  difference: number | null;
  supportMagnitude: number | null;
  choice: SportsLayerChoice;
  status: SportsLayerVoteStatus;
  reason: string;
}

export interface SportsLayerVoteScorecard {
  version: "layer-vote-v1";
  votes: SportsLayerVote[];
  sideAVotes: number;
  sideBVotes: number;
  ties: number;
  abstentions: number;
  sideAWeightedSupport: number;
  sideBWeightedSupport: number;
  aggregateChoice: "A" | "B" | "no call";
  aggregateReason: string;
}

const VOTE_EPSILON = 0.001;

/**
 * Translates each layer's native Side A/Side B score into one independent
 * choice. The aggregate is a majority of eligible layers; raw point totals
 * remain visible as evidence but never override the vote count.
 */
export function calculateLayerVoteScorecard(
  layers: readonly LayerPointInput[],
): SportsLayerVoteScorecard {
  const votes = layers.map<SportsLayerVote>((layer) => {
    if (!Number.isFinite(layer.sideAPoints) || !Number.isFinite(layer.sideBPoints)) {
      return {
        ...layer,
        difference: null,
        supportMagnitude: null,
        choice: "abstain",
        status: "abstain",
        reason: "Layer values are incomplete or non-finite.",
      };
    }

    const difference = layer.sideAPoints - layer.sideBPoints;
    if (Math.abs(difference) <= VOTE_EPSILON) {
      return {
        ...layer,
        difference,
        supportMagnitude: 0,
        choice: "tie",
        status: "tie",
        reason: `Tie: A ${layer.sideAPoints.toFixed(2)} vs B ${layer.sideBPoints.toFixed(2)}.`,
      };
    }

    const choice: "A" | "B" = difference > 0 ? "A" : "B";
    return {
      ...layer,
      difference,
      supportMagnitude: Math.abs(difference),
      choice,
      status: "eligible",
      reason: `${choice} leads: A ${layer.sideAPoints.toFixed(2)} vs B ${layer.sideBPoints.toFixed(2)}.`,
    };
  });

  const sideAVotes = votes.filter((vote) => vote.choice === "A").length;
  const sideBVotes = votes.filter((vote) => vote.choice === "B").length;
  const ties = votes.filter((vote) => vote.choice === "tie").length;
  const abstentions = votes.filter((vote) => vote.choice === "abstain").length;
  const sideAWeightedSupport = votes
    .filter((vote) => vote.choice === "A")
    .reduce((sum, vote) => sum + (vote.supportMagnitude ?? 0), 0);
  const sideBWeightedSupport = votes
    .filter((vote) => vote.choice === "B")
    .reduce((sum, vote) => sum + (vote.supportMagnitude ?? 0), 0);

  const aggregateChoice: SportsLayerVoteScorecard["aggregateChoice"] =
    sideAVotes > sideBVotes ? "A" : sideBVotes > sideAVotes ? "B" : "no call";
  const aggregateReason =
    aggregateChoice === "no call"
      ? sideAVotes + sideBVotes === 0
        ? "No eligible layer votes; all layers tied or abstained."
        : `Layer vote tie: A ${sideAVotes}, B ${sideBVotes}; no aggregate call.`
      : `${aggregateChoice} wins the eligible layer count: A ${sideAVotes}, B ${sideBVotes}.`;

  return {
    version: "layer-vote-v1",
    votes,
    sideAVotes,
    sideBVotes,
    ties,
    abstentions,
    sideAWeightedSupport,
    sideBWeightedSupport,
    aggregateChoice,
    aggregateReason,
  };
}
