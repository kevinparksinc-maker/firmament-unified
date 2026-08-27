import { createRequire } from "node:module";
import {
  eventPlanetAt,
  normalizeDegrees,
  type EventLocalCivilTime,
} from "./eventChartService";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine") as {
  Body: { Sun: unknown };
  Observer: new (latitude: number, longitude: number, height: number) => unknown;
  SearchRiseSet: (body: unknown, observer: unknown, direction: number, dateStart: Date, limitDays: number, metersAboveGround?: number) => { date: Date } | null;
};

export const ARCHETYPES = ["warrior", "intellectual", "merchant", "laborer"] as const;
export type Archetype = (typeof ARCHETYPES)[number];
export type PanchangaOutcome = "side-a" | "side-b" | "no-call";

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

const TITHIS = [
  "Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya",
] as const;

const YOGAS = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhrti",
] as const;

const VARA_BY_WEEKDAY: Record<string, { day: string; ruler: "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" }> = {
  Sunday: { day: "Sunday", ruler: "Sun" },
  Monday: { day: "Monday", ruler: "Moon" },
  Tuesday: { day: "Tuesday", ruler: "Mars" },
  Wednesday: { day: "Wednesday", ruler: "Mercury" },
  Thursday: { day: "Thursday", ruler: "Jupiter" },
  Friday: { day: "Friday", ruler: "Venus" },
  Saturday: { day: "Saturday", ruler: "Saturn" },
};

export type TeamArchetypeProfile = {
  teamName: string;
  primaryArchetype: Archetype;
  secondaryArchetype?: Archetype;
  studyWindow: string;
  evidenceNote: string;
  sources: string[];
  effectiveDate: string;
  validThroughDate: string;
};

export type PanchangaArchetypeRequest = {
  local: EventLocalCivilTime;
  utcDate: Date;
  latitude: number;
  longitude: number;
  timezone: string;
  venueName: string;
  favoriteName: string;
  challengerName: string;
  favoriteSource: string;
  sideAProfile: TeamArchetypeProfile;
  sideBProfile: TeamArchetypeProfile;
};

type Compatibility = {
  archetype: Archetype;
  primary: boolean;
  score: number;
  reasons: string[];
};

export type PanchangaArchetypeResult = {
  version: "panchanga-archetype-v1";
  method: "Panchanga / Team Archetype";
  orientation: "event-instant";
  status: "ready" | "no-call";
  outcome: PanchangaOutcome;
  verdict: string;
  reason: string;
  event: {
    venueName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    eventUtcIso: string;
    localEventDate: string;
    favoriteName: string;
    challengerName: string;
    favoriteSource: string;
  };
  panchanga: {
    coordinateConvention: "tropical ecliptic-of-date";
    sunriseUtcIso: string | null;
    vara: { day: string; ruler: string } | null;
    sunLongitude: number;
    moonLongitude: number;
    elongation: number;
    tithi: { number: number; name: string; paksha: "Shukla" | "Krishna" };
    nakshatra: { number: number; name: string; progressPercent: number; status: "calculated-tropical-not-scored" };
    karana: { index: number; name: string; class: "movable" | "fixed" };
    yoga: { number: number; name: string; progressPercent: number };
    publicPsychology: "Bright half displayed only; no v1 point adjustment." | "Dark half displayed only; no v1 point adjustment.";
  };
  profiles: Array<{
    side: "A" | "B";
    teamName: string;
    profile: TeamArchetypeProfile;
    validation: { valid: boolean; reasons: string[] };
    compatibility: Compatibility[];
    total: number | null;
  }>;
  scoreDifference: number | null;
  noCallReasons: string[];
};

function localDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function previousLocalSunrise(utcDate: Date, latitude: number, longitude: number): Date | null {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  return Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, utcDate, -2, 0)?.date ?? null;
}

function calculateKarana(elongation: number): { index: number; name: string; class: "movable" | "fixed" } {
  const index = Math.floor(normalizeDegrees(elongation) / 6);
  if (index === 0) return { index, name: "Kimstughna", class: "fixed" };
  if (index >= 57) {
    const fixed = ["Shakuni", "Chatushpada", "Naga"] as const;
    return { index, name: fixed[index - 57] ?? "Naga", class: "fixed" };
  }
  const movable = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"] as const;
  return { index, name: movable[(index - 1) % movable.length] ?? "Bava", class: "movable" };
}

function validateProfile(profile: TeamArchetypeProfile, expectedTeamName: string, localEventDate: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (profile.teamName.trim().toLocaleLowerCase() !== expectedTeamName.trim().toLocaleLowerCase()) reasons.push("Profile team name does not match the event team.");
  if (profile.secondaryArchetype && profile.secondaryArchetype === profile.primaryArchetype) reasons.push("Secondary archetype must differ from primary archetype.");
  if (profile.studyWindow.trim().length < 8) reasons.push("Study window is missing or too short.");
  if (profile.evidenceNote.trim().length < 40) reasons.push("Evidence note must describe overall pregame play in at least 40 characters.");
  if (profile.sources.length === 0 || profile.sources.some(source => source.trim().length < 3)) reasons.push("At least one profile source is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.effectiveDate) || !/^\d{4}-\d{2}-\d{2}$/.test(profile.validThroughDate)) reasons.push("Profile effective and valid-through dates must use YYYY-MM-DD.");
  if (profile.effectiveDate > localEventDate) reasons.push("Profile is not yet effective at the event date.");
  if (profile.validThroughDate < localEventDate) reasons.push("Profile is stale at the event date.");
  return { valid: reasons.length === 0, reasons };
}

function evaluateArchetype(archetype: Archetype, varaRuler: string, paksha: "Shukla" | "Krishna", primary: boolean): Compatibility {
  const reasons: string[] = [];
  let score = 0;
  if (archetype === "warrior") {
    if (varaRuler === "Sun" || varaRuler === "Mars") { score += 5; reasons.push("Sun/Mars Vara alignment: +5."); }
    if (varaRuler === "Saturn") { score -= 5; reasons.push("Saturn Vara tension: −5."); }
  }
  if (archetype === "intellectual") {
    if (varaRuler === "Mercury" || varaRuler === "Jupiter") { score += 5; reasons.push("Mercury/Jupiter Vara alignment: +5."); }
    if (paksha === "Krishna") { score -= 4; reasons.push("Krishna Paksha rule: −4."); }
  }
  if (archetype === "merchant") {
    if (varaRuler === "Venus") { score += 6; reasons.push("Venus Vara alignment: +6."); }
    if (varaRuler === "Mars" || varaRuler === "Sun") { score -= 4; reasons.push("Sun/Mars Vara tension: −4."); }
  }
  if (archetype === "laborer") {
    if (varaRuler === "Saturn") { score += 5; reasons.push("Saturn Vara alignment: +5."); }
    if (paksha === "Krishna") { score += 3; reasons.push("Krishna Paksha rule: +3."); }
  }
  if (reasons.length === 0) reasons.push("No v1 scored Panchanga compatibility rule matched.");
  return { archetype, primary, score: Math.max(-10, Math.min(10, score)), reasons };
}

export function calculatePanchangaArchetype(request: PanchangaArchetypeRequest): PanchangaArchetypeResult {
  const sun = eventPlanetAt("Sun", request.utcDate);
  const moon = eventPlanetAt("Moon", request.utcDate);
  const elongation = normalizeDegrees(moon.longitude - sun.longitude);
  const tithiIndex = Math.floor(elongation / 12);
  const paksha: "Shukla" | "Krishna" = tithiIndex < 15 ? "Shukla" : "Krishna";
  const nakshatraIndex = Math.floor(moon.longitude / (360 / 27));
  const yogaRaw = normalizeDegrees(sun.longitude + moon.longitude);
  const yogaIndex = Math.floor(yogaRaw / (360 / 27));
  const sunrise = previousLocalSunrise(request.utcDate, request.latitude, request.longitude);
  const weekday = sunrise ? new Intl.DateTimeFormat("en-US", { timeZone: request.timezone, weekday: "long" }).format(sunrise) : null;
  const vara = weekday ? VARA_BY_WEEKDAY[weekday] ?? null : null;
  const localEventDate = localDateKey(request.utcDate, request.timezone);
  const profileRows = [
    { side: "A" as const, teamName: request.favoriteName, profile: request.sideAProfile },
    { side: "B" as const, teamName: request.challengerName, profile: request.sideBProfile },
  ].map(row => {
    const validation = validateProfile(row.profile, row.teamName, localEventDate);
    const primary = vara && validation.valid
      ? evaluateArchetype(row.profile.primaryArchetype, vara.ruler, paksha, true)
      : null;
    const secondary = vara && validation.valid && row.profile.secondaryArchetype
      ? evaluateArchetype(row.profile.secondaryArchetype, vara.ruler, paksha, false)
      : null;
    const compatibility = primary
      ? [
        primary,
        ...(secondary ? [{ ...secondary, score: secondary.score / 2, reasons: ["Secondary half-weight.", ...secondary.reasons] }] : []),
      ]
      : [];
    const total = validation.valid && vara ? compatibility.reduce((sum, item) => sum + item.score, 0) : null;
    return { ...row, validation, compatibility, total };
  });
  const noCallReasons = [
    ...(sunrise ? [] : ["A venue sunrise could not be found within the prior two days; Vara is unavailable."]),
    ...profileRows.flatMap(row => row.validation.reasons.map(reason => `${row.teamName}: ${reason}`)),
  ];
  const sideATotal = profileRows[0]?.total ?? null;
  const sideBTotal = profileRows[1]?.total ?? null;
  const scoreDifference = sideATotal !== null && sideBTotal !== null ? sideATotal - sideBTotal : null;
  let outcome: PanchangaOutcome = "no-call";
  let verdict = "PROFILE OR PANCHANGA INPUT INCOMPLETE — NO CALL";
  let reason = noCallReasons.join(" ") || "Required Panchanga inputs are unavailable.";
  if (noCallReasons.length === 0 && scoreDifference !== null) {
    if (Math.abs(scoreDifference) < 2) {
      noCallReasons.push("Compatibility difference is below the 2.0-point no-call threshold.");
      verdict = "CLOSE ARCHETYPE COMPATIBILITY — NO CALL";
      reason = noCallReasons.at(-1) ?? "No decisive compatibility difference.";
    } else if (scoreDifference > 0) {
      outcome = "side-a";
      verdict = `EXPERIMENTAL PANCHANGA ALIGNMENT — ${request.favoriteName}`;
      reason = `${request.favoriteName} leads the documented compatibility table by ${scoreDifference.toFixed(1)} point(s).`;
    } else {
      outcome = "side-b";
      verdict = `EXPERIMENTAL PANCHANGA ALIGNMENT — ${request.challengerName}`;
      reason = `${request.challengerName} leads the documented compatibility table by ${Math.abs(scoreDifference).toFixed(1)} point(s).`;
    }
  }
  return {
    version: "panchanga-archetype-v1",
    method: "Panchanga / Team Archetype",
    orientation: "event-instant",
    status: outcome === "no-call" ? "no-call" : "ready",
    outcome,
    verdict,
    reason,
    event: { venueName: request.venueName, latitude: request.latitude, longitude: request.longitude, timezone: request.timezone, eventUtcIso: request.utcDate.toISOString(), localEventDate, favoriteName: request.favoriteName, challengerName: request.challengerName, favoriteSource: request.favoriteSource },
    panchanga: {
      coordinateConvention: "tropical ecliptic-of-date",
      sunriseUtcIso: sunrise?.toISOString() ?? null,
      vara,
      sunLongitude: sun.longitude,
      moonLongitude: moon.longitude,
      elongation,
      tithi: { number: tithiIndex + 1, name: TITHIS[tithiIndex % 15] ?? "Pratipada", paksha },
      nakshatra: { number: nakshatraIndex + 1, name: NAKSHATRAS[nakshatraIndex] ?? "Ashwini", progressPercent: ((moon.longitude % (360 / 27)) / (360 / 27)) * 100, status: "calculated-tropical-not-scored" },
      karana: calculateKarana(elongation),
      yoga: { number: yogaIndex + 1, name: YOGAS[yogaIndex] ?? "Vishkumbha", progressPercent: ((yogaRaw % (360 / 27)) / (360 / 27)) * 100 },
      publicPsychology: paksha === "Shukla" ? "Bright half displayed only; no v1 point adjustment." : "Dark half displayed only; no v1 point adjustment.",
    },
    profiles: profileRows,
    scoreDifference,
    noCallReasons,
  };
}
