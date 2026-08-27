import { createRequire } from "module";
import { describe, expect, it } from "vitest";
import { calculateChart } from "./ephemeris";

const require = createRequire(import.meta.url);
const Astronomy = require("astronomy-engine");

const circularSeparation = (first: number, second: number) => {
  const raw = Math.abs(first - second) % 360;
  return raw > 180 ? 360 - raw : raw;
};

describe("legacy ephemeris topocentric longitude contract", () => {
  it("uses a local observer-relative ecliptic vector for physical planets while retaining mean nodes as named mathematical points", async () => {
    const date = new Date("1990-02-11T00:00:00.000Z");
    const observer = { latitude: 35.7056, longitude: 139.7519, altitude: 0 };
    const result = await calculateChart(date, observer);
    const moon = result.planets.find((planet) => planet.name === "Moon");
    const rahu = result.planets.find((planet) => planet.name === "Rahu");
    const ketu = result.planets.find((planet) => planet.name === "Ketu");

    const geocentricMoon = Astronomy.Ecliptic(
      Astronomy.GeoVector(Astronomy.Body.Moon, Astronomy.MakeTime(date), true),
    ).elon;

    expect(moon).toEqual(expect.objectContaining({ longitudeSource: "topocentric-apparent-ecliptic" }));
    expect(rahu).toEqual(expect.objectContaining({ longitudeSource: "mean-node-ecliptic" }));
    expect(ketu).toEqual(expect.objectContaining({ longitudeSource: "mean-node-ecliptic" }));
    expect(circularSeparation(moon!.eclipticLon, geocentricMoon)).toBeGreaterThan(0.01);
  });

  it("retains exact stadium coordinates instead of silently substituting a city-center observer", async () => {
    const date = new Date("1990-02-11T00:00:00.000Z");
    const tokyoDome = { latitude: 35.7056, longitude: 139.7519, altitude: 0 };
    const tokyoCityCenter = { latitude: 35.6762, longitude: 139.6503, altitude: 0 };
    const [domeChart, cityChart] = await Promise.all([
      calculateChart(date, tokyoDome),
      calculateChart(date, tokyoCityCenter),
    ]);
    const domeMoon = domeChart.planets.find((planet) => planet.name === "Moon")!;
    const cityMoon = cityChart.planets.find((planet) => planet.name === "Moon")!;

    expect(domeChart.observer).toEqual(tokyoDome);
    expect(cityChart.observer).toEqual(tokyoCityCenter);
    expect(circularSeparation(domeChart.houses.ascendant, cityChart.houses.ascendant)).toBeGreaterThan(0.001);
    expect(circularSeparation(domeMoon.eclipticLon, cityMoon.eclipticLon)).toBeGreaterThan(0.00001);
  });
});
