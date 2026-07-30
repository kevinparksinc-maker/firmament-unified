/**
 * RAW CHART DATA DUMP
 *
 * Zero interpretation. Zero game context. Zero summary.
 * Pure structured data only.
 */

import { calculateChart } from "./ephemeris";
import { SIGN_RULERS, EXALTATIONS, DEBILITATIONS } from "./astroEngine";
import { COMBUSTION_ORBS, ASPECT_ORBS } from "./houseScoringConstants";
import { detectFixedStars } from "./fixedStarDetection";
import type { PlanetPosition } from "./ephemeris";

async function rawChartDataDump() {
  const date = new Date(Date.UTC(2026, 6, 16, 22, 30, 0));
  const observer = {
    latitude: 39.9526,
    longitude: -75.1652,
    altitude: 0,
  };

  const ephResult = await calculateChart(date, observer);
  const planetsArray = ephResult.planets;
  const houses = ephResult.houses;
  const fixedStars = detectFixedStars(planetsArray);

  const ZODIAC = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  // BUILD HOUSES DATA
  const housesData: any[] = [];
  for (let h = 0; h < 12; h++) {
    const lon = houses.cusps[h]!;
    const signIdx = Math.floor(lon / 30);
    const sign = ZODIAC[signIdx] ?? "Aries";
    const degree = lon % 30;
    const ruler = SIGN_RULERS[sign];

    housesData.push({
      house: h + 1,
      sign,
      cusp_degree: parseFloat(degree.toFixed(2)),
      cusp_longitude_sidereal: parseFloat(lon.toFixed(2)),
      ruling_planet: ruler,
    });
  }

  // BUILD PLANETS DATA
  const planetsData: any[] = [];
  for (const p of planetsArray) {
    let dignity = "";
    if (EXALTATIONS[p.name] === p.sign) {
      dignity = "exaltation";
    } else if (DEBILITATIONS[p.name] === p.sign) {
      dignity = "fall";
    } else if (SIGN_RULERS[p.sign] === p.name) {
      dignity = "domicile";
    } else {
      const ownSigns = Object.entries(SIGN_RULERS)
        .filter(([_, r]) => r === p.name)
        .map(([s, _]) => s);
      if (
        ownSigns.length > 0 &&
        ownSigns.some((s) => {
          const oppSign = ZODIAC[(ZODIAC.indexOf(s) + 6) % 12];
          return oppSign === p.sign;
        })
      ) {
        dignity = "detriment";
      } else {
        dignity = "peregrine";
      }
    }

    let combustion_status = "none";
    const sun = planetsArray.find((x) => x.name === "Sun");
    if (sun && p.name !== "Sun") {
      const sep = Math.abs(p.eclipticLon - sun.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);
      const orb = COMBUSTION_ORBS[p.name as keyof typeof COMBUSTION_ORBS] || COMBUSTION_ORBS.DEFAULT;

      if (minSep <= 0.1) {
        combustion_status = "cazimi";
      } else if (minSep <= orb) {
        combustion_status = "combust";
      }
    }

    const fixedStarOnPlanet = fixedStars.find((s) => s.planet === p.name);

    planetsData.push({
      name: p.name,
      sign: p.sign,
      degree_in_sign: parseFloat(p.degreeInSign.toFixed(1)),
      minutes: p.minutes,
      longitude_tropical: parseFloat(p.eclipticLon.toFixed(2)),
      longitude_sidereal: parseFloat(p.eclipticLon.toFixed(2)),
      house: p.house,
      retrograde: p.retrograde,
      essential_dignity: dignity,
      combustion_status,
      altitude: parseFloat(p.altitude.toFixed(2)),
      azimuth: parseFloat(p.azimuth.toFixed(2)),
      fixed_star: fixedStarOnPlanet
        ? {
            name: fixedStarOnPlanet.name,
            orb: parseFloat(fixedStarOnPlanet.orb.toFixed(2)),
            nature: fixedStarOnPlanet.nature,
          }
        : null,
    });
  }

  // BUILD ASPECTS DATA
  const aspectsData: any[] = [];
  const aspectTypes = [
    { name: "Conjunction", angle: 0, orb: ASPECT_ORBS.CONJUNCTION },
    { name: "Sextile", angle: 60, orb: ASPECT_ORBS.SEXTILE },
    { name: "Square", angle: 90, orb: ASPECT_ORBS.SQUARE },
    { name: "Trine", angle: 120, orb: ASPECT_ORBS.TRINE },
    { name: "Opposition", angle: 180, orb: ASPECT_ORBS.OPPOSITION },
  ];

  for (let i = 0; i < planetsArray.length; i++) {
    for (let j = i + 1; j < planetsArray.length; j++) {
      const p1 = planetsArray[i]!;
      const p2 = planetsArray[j]!;

      const sep = Math.abs(p1.eclipticLon - p2.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      for (const aspect of aspectTypes) {
        const diff = Math.abs(minSep - aspect.angle);
        if (diff <= aspect.orb) {
          aspectsData.push({
            planet_1: p1.name,
            planet_2: p2.name,
            type: aspect.name,
            orb: parseFloat(diff.toFixed(2)),
          });
        }
      }
    }
  }

  // BUILD SPECIAL CONDITIONS DATA
  const specialConditionsData: any[] = [];

  // Besieged check
  const MALEFIC_PLANETS = ["Mars", "Saturn"];
  for (const p of planetsArray) {
    const maleficsNear = planetsArray.filter((other) => {
      if (!MALEFIC_PLANETS.includes(other.name)) return false;
      const sep = Math.abs(p.eclipticLon - other.eclipticLon);
      return sep <= 8 && sep > 0.1;
    });
    if (maleficsNear.length >= 2) {
      specialConditionsData.push({
        type: "besieged",
        planet: p.name,
        trapped_between: maleficsNear.map((m) => m.name),
      });
    }
  }

  // Planetary war check
  for (let i = 0; i < planetsArray.length; i++) {
    for (let j = i + 1; j < planetsArray.length; j++) {
      const p1 = planetsArray[i]!;
      const p2 = planetsArray[j]!;
      const sep = Math.abs(p1.eclipticLon - p2.eclipticLon);
      const minSep = Math.min(sep, 360 - sep);

      if (minSep <= 1 && minSep > 0) {
        specialConditionsData.push({
          type: "planetary_war",
          planet_1: p1.name,
          planet_2: p2.name,
          separation: parseFloat(minSep.toFixed(2)),
        });
      }
    }
  }

  // Mutual reception check
  for (let i = 0; i < planetsArray.length; i++) {
    for (let j = i + 1; j < planetsArray.length; j++) {
      const p1 = planetsArray[i]!;
      const p2 = planetsArray[j]!;

      if (
        SIGN_RULERS[p1.sign] === p2.name &&
        SIGN_RULERS[p2.sign] === p1.name
      ) {
        specialConditionsData.push({
          type: "mutual_reception",
          planet_1: p1.name,
          planet_2: p2.name,
        });
      }
    }
  }

  // COMPILE FINAL DATA OBJECT
  const chartData = {
    chart_date: date.toISOString(),
    location: {
      latitude: observer.latitude,
      longitude: observer.longitude,
      altitude: observer.altitude,
    },
    ephemeris: {
      ayanamsa_lahiri: 0,
      ascendant_sidereal: parseFloat(houses.ascendant.toFixed(2)),
      mc_sidereal: parseFloat(houses.mc.toFixed(2)),
    },
    houses: housesData,
    planets: planetsData,
    aspects: aspectsData,
    special_conditions: specialConditionsData,
  };

  console.log(JSON.stringify(chartData, null, 2));
}

rawChartDataDump();
