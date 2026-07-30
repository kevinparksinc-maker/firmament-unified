/**
 * mergeOcrText — Merge newly extracted OCR text into existing textarea content.
 * Deduplicates by planet name: if a planet line already exists in the existing text,
 * the new line is skipped. Planet detection is case-insensitive and strips "Transit" prefix.
 */

const PLANET_NAMES = [
  "Sun",
  "Moon",
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Rahu",
  "Ketu",
  "Asc",
  "Ascendant",
];

/** Extract the planet name key from a placement line, or null if not a planet line. */
function extractPlanetKey(line: string): string | null {
  const normalized = line.trim().replace(/^Transit\s+/i, "");
  for (const planet of PLANET_NAMES) {
    if (new RegExp(`^${planet}\\b`, "i").test(normalized)) {
      return planet.toLowerCase();
    }
  }
  return null;
}

/** Returns the set of planet keys already present in existing text. */
function getPresentPlanets(text: string): Set<string> {
  const present = new Set<string>();
  for (const line of text.split("\n")) {
    const key = extractPlanetKey(line);
    if (key) present.add(key);
  }
  return present;
}

/**
 * Merge `newText` into `existing`, skipping any planet lines already present.
 * Non-planet lines (blank lines, comments) from newText are always appended.
 */
export function mergeOcrText(existing: string, newText: string): string {
  if (!newText.trim()) return existing;
  const presentPlanets = getPresentPlanets(existing);
  const newLines = newText.split("\n");
  const toAdd: string[] = [];

  for (const line of newLines) {
    const key = extractPlanetKey(line);
    if (key) {
      if (!presentPlanets.has(key)) {
        toAdd.push(line);
        presentPlanets.add(key); // prevent duplicates within newText itself
      }
      // else skip — planet already present
    } else {
      // Non-planet lines (blank, etc.) — only add if not already a duplicate blank
      if (line.trim() !== "" || toAdd[toAdd.length - 1]?.trim() !== "") {
        toAdd.push(line);
      }
    }
  }

  if (toAdd.length === 0) return existing;

  const trimmedExisting = existing.trim();
  const trimmedNew = toAdd.join("\n").trim();

  return trimmedExisting ? `${trimmedExisting}\n${trimmedNew}` : trimmedNew;
}
