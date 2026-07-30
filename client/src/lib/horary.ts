import { generateReading } from "./readingEngine4";
import type { UserContext, ReadingOutput } from "./readingEngine4";

export interface OraryState {
  lastQuestion?: string;
  lastIntent?: string;
  lastFocus?: string;
}

// Keep type OUTSIDE function (important)
type Intent =
  | "general"
  | "explain"
  | "action"
  | "simulate"
  | "isolate"
  | "focus";

/**
 * ORARY LAYER
 * - Interprets user intent
 * - Focuses the chart context
 * - Routes into Reading Engine
 */
export function oraryLayer(
  message: string,
  analysis: any,
  context: UserContext,
  state: OraryState = {}
): {
  reading: ReadingOutput;
  state: OraryState;
  debug: {
    intent: Intent;
    focus: string | null;
  };
} {
  const q = message.toLowerCase();

  // -------------------------
  // 1. INTENT DETECTION
  // -------------------------
  let intent: Intent = "general";

  if (q.includes("why")) intent = "explain";
  else if (q.includes("what should i") || q.includes("what do i do"))
    intent = "action";
  else if (q.includes("what if")) intent = "simulate";
  else if (q.includes("which") || q.includes("what planet")) intent = "isolate";
  else if (q.includes("focus") || q.includes("zoom")) intent = "focus";

  // -------------------------
  // 2. FOCUS DETECTION
  // -------------------------
  const planets = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "rahu",
    "ketu",
  ];

  let focus: string | null = null;

  for (const p of planets) {
    if (q.includes(p)) {
      focus = p;
      break;
    }
  }

  // -------------------------
  // 3. CONTEXT MODIFICATION
  // -------------------------
  const modifiedContext: UserContext = {
    ...context,
    question: message,
    focusArea:
      intent === "action" ? context.focusArea || "general" : context.focusArea,
  };

  // -------------------------
  // 4. GENERATE READING
  // -------------------------
  const reading = generateReading(analysis, modifiedContext);

  // -------------------------
  // 5. STATE UPDATE
  // -------------------------
  const newState: OraryState = {
    lastQuestion: message,
    lastIntent: intent,
    lastFocus: focus || state.lastFocus,
  };

  return {
    reading,
    state: newState,
    debug: {
      intent,
      focus,
    },
  };
}
