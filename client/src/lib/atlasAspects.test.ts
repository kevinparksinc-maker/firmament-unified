import { describe, expect, it } from "vitest";
import {
  calculateAtlasAspectScan,
  findAtlasAngularContacts,
  findAtlasAspects,
  findAtlasConfigurations,
  findAtlasDispositorChains,
  findAtlasMutualReceptions,
  findAtlasStelliums,
} from "./atlasAspects";

const point = (name: string, longitude: number, sign = "Aries", house = 1, speedDegreesPerDay = 1) => ({ key: name.toLowerCase(), name, kind: "planet" as const, longitude, sign, house, speedDegreesPerDay });

describe("Atlas local aspects and configurations", () => {
  it("detects declared major aspects with exact raw separation, orb, and motion state", () => {
    const aspects = findAtlasAspects([
      point("Alpha", 0, "Aries", 1, 0.8),
      point("Beta", 60.5, "Gemini", 3, 0),
      point("Gamma", 90, "Cancer", 4, 0),
      point("Delta", 120, "Leo", 5, 0),
      point("Epsilon", 180, "Libra", 7, 0),
      point("Zeta", 150, "Virgo", 6, 0),
    ]);
    expect(aspects).toEqual(expect.arrayContaining([
      expect.objectContaining({ first: "Alpha", second: "Beta", type: "sextile", separation: 60.5, orb: 0.5, state: "applying" }),
      expect.objectContaining({ first: "Alpha", second: "Gamma", type: "square", separation: 90, orb: 0, state: "exact" }),
      expect.objectContaining({ first: "Alpha", second: "Delta", type: "trine", separation: 120, orb: 0 }),
      expect.objectContaining({ first: "Alpha", second: "Epsilon", type: "opposition", separation: 180, orb: 0 }),
      expect.objectContaining({ first: "Alpha", second: "Zeta", type: "quincunx", separation: 150, orb: 0 }),
    ]));
  });

  it("detects a direct-chart angular contact and sign/Equal-House stelliums", () => {
    const planets = [point("Mars", 236, "Scorpio", 1), point("Mercury", 223, "Scorpio", 12), point("Venus", 215, "Scorpio", 12), point("Pluto", 218, "Scorpio", 12)];
    const contacts = findAtlasAngularContacts(planets, [{ key: "asc", name: "Ascendant", kind: "angle" as const, longitude: 234.703 }]);
    expect(contacts).toEqual([expect.objectContaining({ planet: "Mars", angle: "Ascendant", orbLimit: 5 })]);
    expect(contacts[0]?.distance).toBeCloseTo(1.297, 8);
    expect(findAtlasStelliums(planets)).toEqual(expect.arrayContaining([
      expect.objectContaining({ scope: "sign", location: "Scorpio", planets: ["Mars", "Mercury", "Venus", "Pluto"] }),
      expect.objectContaining({ scope: "Equal House", location: "House 12", planets: ["Mercury", "Venus", "Pluto"] }),
    ]));
  });

  it("records traditional dispositors and mutual reception without assigning an outer-planet ruler", () => {
    const planets = [point("Mars", 215, "Scorpio"), point("Venus", 5, "Aries"), point("Uranus", 250, "Sagittarius")];
    expect(findAtlasDispositorChains(planets)).toEqual(expect.arrayContaining([
      expect.objectContaining({ planet: "Mars", immediateRuler: "Mars", isLoop: true, chain: ["Mars", "Mars"] }),
      expect.objectContaining({ planet: "Uranus", immediateRuler: "Jupiter", terminal: "Jupiter", isLoop: false }),
    ]));
    expect(findAtlasMutualReceptions([point("Mars", 35, "Taurus"), point("Venus", 5, "Aries")])).toEqual([expect.objectContaining({ first: "Mars", second: "Venus", firstSign: "Taurus", secondSign: "Aries" })]);
  });

  it("detects declared Grand Trine, T-Square, Grand Cross, Yod, and Kite geometry", () => {
    const grandTrine = [point("A", 0), point("B", 120), point("C", 240)];
    expect(findAtlasConfigurations(grandTrine, findAtlasAspects(grandTrine))).toEqual(expect.arrayContaining([expect.objectContaining({ type: "Grand Trine" })]));

    const tSquare = [point("A", 0), point("B", 180), point("C", 90)];
    expect(findAtlasConfigurations(tSquare, findAtlasAspects(tSquare))).toEqual(expect.arrayContaining([expect.objectContaining({ type: "T-Square" })]));

    const cross = [point("A", 0), point("B", 90), point("C", 180), point("D", 270)];
    expect(findAtlasConfigurations(cross, findAtlasAspects(cross))).toEqual(expect.arrayContaining([expect.objectContaining({ type: "Grand Cross" })]));

    const yod = [point("A", 0), point("B", 60), point("C", 210)];
    expect(findAtlasConfigurations(yod, findAtlasAspects(yod))).toEqual(expect.arrayContaining([expect.objectContaining({ type: "Yod" })]));

    const kite = [point("A", 0), point("B", 120), point("C", 240), point("D", 180)];
    expect(findAtlasConfigurations(kite, findAtlasAspects(kite))).toEqual(expect.arrayContaining([expect.objectContaining({ type: "Kite" })]));
  });

  it("returns all calculation families through one local scan", () => {
    const scan = calculateAtlasAspectScan([point("Mars", 236, "Scorpio", 1), point("Venus", 216, "Scorpio", 12), point("Mercury", 224, "Scorpio", 12)], [{ key: "asc", name: "Ascendant", kind: "angle" as const, longitude: 234.703 }]);
    expect(scan.aspects.length).toBeGreaterThan(0);
    expect(scan.angularContacts).toEqual(expect.arrayContaining([expect.objectContaining({ planet: "Mars" })]));
    expect(scan.stelliums).toEqual(expect.arrayContaining([expect.objectContaining({ location: "Scorpio" })]));
    expect(scan.dispositorChains).toHaveLength(3);
  });
});
