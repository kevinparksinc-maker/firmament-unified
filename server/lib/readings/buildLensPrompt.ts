// buildLensPrompt.ts (simplified — works directly off raw chart text)
import { getLens } from "./lensRules";

export function buildLensPrompt(rawChartText: string, lensId: string): string {
  const lens = getLens(lensId);

  return `
${lens.promptFrame}

Full natal chart data (raw):
${rawChartText}

Only use the houses/planets specified in the instructions above — ignore everything else
in the chart data that isn't relevant to this lens. Respond in the structure given above.
Keep the tone direct and practical — this is guidance the user will act on, not a generic horoscope.
  `.trim();
}
